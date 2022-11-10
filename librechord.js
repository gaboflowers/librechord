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
 * along with Covertau.  If not, see <https://www.gnu.org/licenses/>.
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

const newDecodedStanza = function () { return {'lines': [], 'name': null}; }

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
  this.nextStanzaName = null;
  this.lastDecodedStanza = newDecodedStanza();
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

    node.innerHTML = ''
    this.decodedSong.forEach(function(stanza) {
      let divStanza = document.createElement('div');
      divStanza.classList.add('lch-stanza');

      if (stanza.name) {
        let tableTitle = document.createElement('table');
        tableTitle.classList.add('lch-line');
        tableTitle.classList.add('lch-stanza-name');

        let rowTitle = document.createElement('tr');
        let dataTitle = document.createElement('td');
        dataTitle.innerText = stanza.name;
        rowTitle.append(dataTitle);
        tableTitle.append(rowTitle);
        divStanza.append(tableTitle);
      }

      stanza.lines.forEach(function(line) {
        let tableLine = document.createElement('table');
        tableLine.classList.add('lch-line');

        let rowChords = document.createElement('tr');
        let rowText = document.createElement('tr');
        rowChords.classList.add('lch-chords');
        rowText.classList.add('lch-text');

        line.symbols.forEach(function(symbol) {
          let dataChord = document.createElement('td');
          let dataText = document.createElement('td');
          dataChord.innerHTML = '<a href="#">'+symbol.chord+'</a>';
          textNodeDataText = document.createTextNode(
                                      symbol.text.replace(/ /g, '\u00A0')); // &nbsp;
          dataText.innerHTML = '';
          dataText.append(textNodeDataText);

          rowChords.appendChild(dataChord);
          rowText.appendChild(dataText);
        });
        if (line.note) {
          rowChords.lastChild.classList.add('lch-chord-prev-to-note');
          let dataNote = document.createElement('td');
          dataNote.classList.add('lch-chord-note');
          dataNote.innerText = line.note;
          rowChords.appendChild(dataNote);
        }

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
    /* this.decode transforma las líneas leídas en this.rawLines en una canción
     * parseada en this.decodedSong
     *
     * ORIGINAL:
     * this.decodedSong contiene un arreglo de estrofas ("stanza")
     * cada estrofa es un arreglo de versos ("line")
     * cada verso es un arreglo de símbolos (objetos con campo 'chord' y 'text')
     *
     * NUEVA VERSIÓN:
     * TODO una canción (this.decodedSong) es un objeto con:
     *   - un campo 'stanzas' (que contiene un arreglo de estrofas)
     *   - otros campos, como 'title', 'artist', 'references'
     * cada estrofa es un objeto con:
     *   - un campo 'lines' (que contiene un arreglo de versos)
     *   - un campo 'name' (que contiene un string)
     * TODO cada verso es un objeto con:
     *   - un campo 'symbols' (que contiene un arreglo de símbolos)
     *   - un campo 'note' (que contiene un string)
     * */
    for (let i=0; i<this.rawLines.length; i++) {
      let thisDecodedLine = [];

      let thisLine = this.rawLines[i].replace(/^ *$/, '');
      if (thisLine.length == 0) {
        // dos saltos de línea marcan una nueva estrofa
        if (this.doubleNewLine) {
          if (this.lastDecodedStanza.lines.length > 0) {
            this.lastDecodedStanza.name = this.nextStanzaName;
            this.nextStanzaName = null;
            // Aquí se agrega una nueva estrofa a la canción
            this.decodedSong.push(this.lastDecodedStanza);
            this.lastDecodedStanza = newDecodedStanza();
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

      if (thisLine[0] == '=') {
        // Esta línea tiene el título de una estrofa
        this.nextStanzaName = thisLine.substr(1).replace(/^=+/, '').replace(/=+$/, '');
        this.nextStanzaName = this.nextStanzaName.replace(/^\s+/, '').replace(/\s+$/, '');
        continue;
      }

      if (thisLine[0] != '<') {
        // Estoy esperando una línea que contenga una secuencia de acordes
        continue;
      }
      this.doubleNewLine = false; // ya estamos en la nueva estrofa
      // thisLine tiene una secuencia de acordes

      /*
       * // Ahora acepto secuencias de acordes sueltas:
       * //
       * // <-Dm-----|E7-----|Am-
       * //
      if (i+2 >= this.rawLines.length) {
        throw 'Fin de archivo LibreChord inesperado';
      }
      */

      //let rawChordSequence = thisLine;
      //  Ahora acepto notas al final de una secuencia de acordes
      //  <-A-|-C#m-|-Bm-|-D-(x3)
      let rawChordToks = thisLine.split(' ')
      let rawChordSequence = rawChordToks[0];
      // La parte de las notas 
      let rawLineNotesPart = rawChordToks.slice(1);
      let rawLineNotes = rawLineNotesPart ? rawLineNotesPart.reduce((a,b) => a.replace(/ +$/,'') + ' ' + b.replace(/ +$/,''), '') :
                                            null;
      let middleLine = this.rawLines[i+1];
      let rawTextLine = this.rawLines[i+2];

      let freeChordSequence = false;
      if (middleLine[0] != '+') {
        // secuencia de acorde suelta
        freeChordSequence = true;
      } else if (rawTextLine[0] != '>') {
        throw `Se esperaba '>', se encontró '${rawTextLine[0]}'`;
      }

      middleLine = middleLine.substr(1).replace(/-/g, '');
      rawTextLine = rawTextLine.substr(1).replace(/-/g, '');

      let chords = this.parseChordSequence(rawChordSequence);
      let morae = freeChordSequence ? new Array(chords.length).fill('   ') : rawTextLine.split('|');
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
      this.lastDecodedStanza.lines.push({'symbols': thisDecodedLine,
                                         'note': rawLineNotes});
    }
    // end for rawlines
    if (this.lastDecodedStanza.lines.length != 0) {
      // quedó una estrofa sin pushear
      this.lastDecodedStanza.name = this.nextStanzaName;
      this.decodedSong.push(this.lastDecodedStanza);
    }
    this.isDecoded = true;
  };

  this.parseChordSequence = function (rawChordSequence) {
    return rawChordSequence.substr(1).split('|').map((chordMora) =>
      // ignorar todo después del primer '-' que sucede al acorde
      chordMora.replace(/^-+/g,'').replace(/-.*/g,'').replace(/ +/g, '')
    )
  }

  this.getLastDecodedLine = function() {
    let ldsLen = this.lastDecodedStanza.lines.length;
    if (ldsLen != 0) {
      return this.lastDecodedStanza.lines[ldsLen - 1];
    }

    let songLen = this.decodedSong.length;
    if (songLen != 0) {
      let ldStanza = this.decodedSong[songLen - 1];
      return ldStanza.lines[ldStanza.lines.length - 1];
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

    this.chordise(this.target);
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

