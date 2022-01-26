/*
 * This file is part of LibreChord.
 * LibreChord is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * LibreChord is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with LibreChord.  If not, see <https://www.gnu.org/licenses/>.
 */

/*
 * Dependencias:
 * - chorddiagrams.js
 * - chords.js (opcional)
 */

function HTMLEncode(s) {
  return s.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/&/g, '&amp;');
}
function HTMLDecode(s) {
  return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g, '&');
}


function LChorder(data, target, options) {
  if (options === undefined) {
    options = target;
    target = undefined;
  }
  this.target = target;

  this.rawText = data.innerHTML || data;
  this.rawLines = this.rawText.split('\n').map(HTMLDecode);
  this.decodedSong = [];
  this.isDecoded = false;
  this.lastDecodedStanza = [];
  this.doubleNewLine = false;
  this.attachedChords = {};
  this.chordDefinitions = options.chordDefinitions;

  this.parseOptions = function(options) {
    options.duplicateLastChord = options.duplicateLastChord === undefined ? false : options.duplicateLastChord;
    options.showChordDiagram = options.showChordDiagram === undefined ? true: options.showChordDiagram;
    options.canvasWidth = options.canvasWidth == undefined ? 200: options.canvasWidth;
    options.canvasHeight = options.canvasHeight == undefined ? 130 : options.canvasHeight;
    return options;
  }

  this.options = this.parseOptions(options);

  this.chordise = function (node) {
    if (node == undefined && this.target == undefined) {
      node = document.createElement('div');
    } else if (this.target != undefined) {
      node = this.target;
    }

    if (this.decodedSong.length == 0) {
      throw 'No hay ninguna canción decodificada';
    }

    node.innerHTML = '';
    this.decodedSong.forEach(function(stanza) {
      let divStanza = document.createElement('div');
      divStanza.classList.add('lch-stanza');

      stanza.forEach(function(line) {
        let tableLine = document.createElement('table');
        tableLine.classList.add('lch-line');

        let rowChords = document.createElement('tr');
        let rowText = document.createElement('tr');
        rowChords.classList.add('lch-chords');
        rowText.classList.add('lch-text');

        line.forEach(function(symbol) {
          let dataChord = document.createElement('td');
          let dataText = document.createElement('td');
          dataChord.innerHTML = '<a href="#">'+symbol.chord+'</a>';
          dataText.innerHTML = symbol.text.replace(/ /g, '&nbsp;');

          rowChords.appendChild(dataChord);
          rowText.appendChild(dataText);
        });
        tableLine.appendChild(rowChords);
        tableLine.appendChild(rowText);

        divStanza.appendChild(tableLine);
      });
      node.appendChild(divStanza);
    });
    return node.innerHTML;
  }

  this.decodeChordLine = function(chordLine) {
    chordLine = chordLine.substr(1).replace(/ +/g, ' ').replace(/^ /g, '');
    let chordToks = chordLine.split(' ');
    let chordName = chordToks[0];
    let chordValues = chordToks.slice(1);
    this.attachedChords[chordName] = chordValues;
  }

  this.decode = function () {
    for (let i=0; i<this.rawLines.length; i++) {
      let thisDecodedLine = [];

      let thisLine = this.rawLines[i].replace(/^ *$/, '');
      if (thisLine.length == 0) {
        // dos saltos de línea marcan una nueva estrofa
        if (this.doubleNewLine) {
          if (this.lastDecodedStanza.length > 0 ){
            this.decodedSong.push(this.lastDecodedStanza);
            this.lastDecodedStanza = [];
          }
          this.doubleNewLine = false;
        } else {
          this.doubleNewLine = true;
        }
      }

      if (thisLine[0] == '#') {
        // Esta línea incluye una definición de acorde
        this.decodeChordLine(thisLine);
        continue;
      }

      if (thisLine[0] != '<') {
        // Estoy esperando una línea que contenga una secuencia de acordes
        continue;
      }

      this.doubleNewLine = false;

      if (i+2 >= this.rawLines.length) {
        throw 'Fin de archivo LibreChord inesperado';
      }

      let rawChordLine = thisLine;
      let middleLine = this.rawLines[i+1];
      let rawTextLine = this.rawLines[i+2];
      if (middleLine[0] != '+') {
        throw 'Se esperaba \'+\', se encontró \''+middleLine[0]+'\'';
      }
      if (rawTextLine[0] != '>') {
        throw 'Se esperaba \'>\', se encontró \''+middleLine[0]+'\'';
      }

      rawChordLine = rawChordLine.substr(1).replace(/-/g, '');
      middleLine = middleLine.substr(1).replace(/-/g, '');
      rawTextLine = rawTextLine.substr(1).replace(/-/g, '');

      let chords = rawChordLine.replace(/ +/g, '').split('|');
      let morae = rawTextLine.split('|');
      if (chords.length != morae.length) {
        throw `La cantidad de acordes es ${chords.length}, distinta del largo de la cantidad de moras ${morae.length}. Revisa tus separa|dores.`
      }

      for (let j=0; j<chords.length; j++) {
        // marca de continuación de acorde desde la línea anterior
        let chord = chords[j];
        if (j == 0 && chord.length == 0 && middleLine[0] == '>' && this.options.duplicateLastChord) {
          let lastDecodedLine = this.getLastDecodedLine();
          if (lastDecodedLine.length > 0) {
            chord = lastDecodedLine[lastDecodedLine.length - 1].chord;
          }
        }

        let newSymbol = {'chord': chord,
                         'text': morae[j]};
        thisDecodedLine.push(newSymbol);
      }
      this.lastDecodedStanza.push(thisDecodedLine);
    }
    // end for rawlines
    if (this.lastDecodedStanza.length != 0) {
      // quedó una estrofa sin pushear
      this.decodedSong.push(this.lastDecodedStanza);
    }
    this.isDecoded = true;
  };

  this.getLastDecodedLine = function() {
    let ldsLen = this.lastDecodedStanza.length;
    if (ldsLen != 0) {
      return this.lastDecodedStanza[ldsLen - 1];
    }

    let songLen = this.decodedSong.length;
    if (songLen != 0) {
      let lds = this.decodedSong[songLen - 1];
      return lds[lds.length - 1];
    }

    return [];
  }

  // https://www.w3schools.com/howto/howto_js_draggable.asp
  this.makeDraggable = function (modal) {
    let xStart = 0, yStart = 0;
    const header = modal.querySelector('.lch-modal-header');

    header.onmousedown = function (e) {
      e = e || window.event;
      e.preventDefault();
      xStart = e.pageX;
      yStart = e.pageY;

      document.onmouseup = function () {
        document.onmouseup = null;
        document.onmousemove = null;
      }

      document.onmousemove = dragElement;
    }

    let xEnd, yEnd;
    function dragElement(e) {
      e = e || window.event;
      e.preventDefault;
      xEnd = xStart - e.pageX;
      yEnd = yStart - e.pageY;
      xStart = e.pageX;
      yStart = e.pageY;

      modal.style.top = (modal.offsetTop - yEnd) + 'px';
      modal.style.left = (modal.offsetLeft - xEnd) + 'px';
    }
  }

  this.findChord = function (chordName) {
    // Los acordes agregados manualmente tienen prioridad
    if (chordName in this.attachedChords) {
      return this.attachedChords[chordName];
    }
    // Si no, buscamos en un objeto ChordDefinitions
    if (this.chordDefinitions != undefined) {
      return this.chordDefinitions.getChord(chordName);
    }
    return undefined;
  }

  this.showChordName = function (chordName, event) {
      chordName = chordName.trim();
      let chord = this.findChord(chordName);
      if (!chord) {
          return;
      }
      this.showChord(chord, chordName, event);
  }

  this.showChord = function (chord, chordName, event) {
    event = event || {pageX: 0, pageY: 0};

    // ver donde hizo clic el usuario
    let posX = event.pageX;
    let posY = event.pageY;

    // crear modal del acorde
    const modal = document.createElement('div');
    modal.classList.add('lch-modal');
    this.target.appendChild(modal);

    const upperDiv = document.createElement('div');
    upperDiv.classList.add('lch-modal-header');
    modal.appendChild(upperDiv);

    const spanTitle = document.createElement('span');
    spanTitle.classList.add('lch-modal-title');
    spanTitle.innerHTML = chordName;

    const spanClose = document.createElement('span');
    spanClose.classList.add('lch-close-modal');
    spanClose.innerHTML = 'x';
    upperDiv.appendChild(spanClose);
    upperDiv.appendChild(spanTitle);

    spanClose.onclick = function () {
      this.parentNode.parentNode.remove();
    }

    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', this.options.canvasWidth);
    canvas.setAttribute('height', this.options.canvasHeight);
    modal.appendChild(canvas);

    drawChord(canvas, chord, this.options);

    // bindearlo arrastrable
    this.makeDraggable(modal);

    // ubicarlo justo bajo el cursor
    modal.style.top = posY+'px';
    modal.style.left = posX+'px';
  }

  let chorder = this;
  this.bindCreateModal = function (a) {
    a.onclick = function(e) {
      e = e || window.event;
      e.preventDefault();
      chorder.showChordName(this.innerHTML, e);
    }
  }

  this.show = function(node) {
    if (node === undefined && this.target == undefined) {
      throw 'No hay objeto de target donde dibujar';
    }
    if (this.target == undefined) {
      this.target = node;
    }

    if (!this.isDecoded) {
      this.decode();
    }

    this.chordise(node);
    let chordRows = document.getElementsByClassName('lch-chords');
    for (let i=0; i<chordRows.length; i++) {
      let chordRow = chordRows[i];
      let anchorChords = chordRow.querySelectorAll('a');

      // Bindear el crear el modal
      for (let j=0; j<anchorChords.length; j++) {
        this.bindCreateModal(anchorChords[j]);
      }
    }

  }
}

