function HTMLEncode(s) {
  return s.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/&/g, '&amp;');
}
function HTMLDecode(s) {
  return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g, '&');
}

function ChordDiagram(ctx, options) {
  this.ctx = ctx;
  options = options || {};
  this.startFret = options.startFret || 1;
  this.nutSize = options.nutSize || 5;
  this.neckLength = options.neckLength || 175;
  this.numberOfFrets = options.numberOfFrets;
  this.fretLength = options.fretLength;
  if (this.numberOfFrets) {
    this.fretLength = this.neckLength/this.numberOfFrets;
  } else {
    this.fretLength = this.fretLength || 41.25;
    this.numberOfFrets = this.neckLength/this.fretLength;
    this.neckLength = this.numberOfFrets*this.fretLength;
  }
  this.numberOfStrings = options.numberOfStrings || 6;
  this.neckWidth = options.neckWidth || 100;

  this.showStringLabels = options.showStringLabels || true;
  this.showFretLabels = options.showFretLabels || true;
  this.stringLabels = options.stringLabels || ['E', 'B', 'G', 'D', 'A', 'E'];

  this.xOrig = options.xOrig || 10;
  this.yOrig = options.yOrig || 10;
  this.labelFont = options.labelFont || '10px sans-serif';

  // color de la X (cuerda sin presionar)
  this.noStringColour = options.noStringColour || '#A00';
  // etiqueta de los puntos etiquetados
  this.xOffsetFinger = options.xOffsetFinger || -3;
  this.yOffsetFinger = options.yOffsetFinger || 4;
  this.labelFingerColour = options.labelFingerColour || '#FFF';
  // grosor del cejillo
  this.barLineWidth = options.barLineWidth || 8;

  // factor de escala
  this.scale = options.scale || 1;

  // guardar los estilos originales del contexto
  this.savedCtxFillStyle = ctx.fillStyle;
  this.savedCtxFont = ctx.font;
  this.savedLineWidth = ctx.lineWidth;

  // si se muestran los nombres de las cuerdas, reservar espacio
  this.neckLength = this.showStringLabels ? this.neckLength - 10: this.neckLength;
  this.xOrig = this.showStringLabels ? this.xOrig+10: this.xOrig;

  // cejilla de la guitarra (nut)
  this.nutSize = (this.startFret == 1) ? this.nutSize : 0; // quitar cejilla si no empieza en el traste 1

  this.ready = false;

  this.init = function () {
    if (this.ready) {
      return;
    }
    if (this.scale != 1) {
      this.ctx.save();
      this.ctx.scale(this.scale, this.scale);
    }
    this.ctx.fillRect(this.xOrig, this.yOrig, this.nutSize, this.neckWidth);
    this.ctx.strokeRect(this.xOrig, this.yOrig, this.nutSize, this.neckWidth);

    // mástil de la guitarra
    this.ctx.strokeRect(this.xOrig+this.nutSize, this.yOrig, this.neckLength, this.neckWidth);

    // donde comienza el eje x de los trastes
    this.xFretOrig = this.xOrig + this.nutSize;

    this.stringSeparation = this.neckWidth / (this.numberOfStrings - 1);

    // dibujar cuerdas
    for (let i=1; i<this.numberOfStrings-1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.xFretOrig, this.yOrig + i*this.stringSeparation);
      this.ctx.lineTo(this.xFretOrig + this.neckLength, this.yOrig + i*this.stringSeparation);
      this.ctx.stroke();
    }

    // dibujar trastes
    for (let j=1; j<this.numberOfFrets; j++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.xFretOrig + j*this.fretLength, this.yOrig);
      this.ctx.lineTo(this.xFretOrig + j*this.fretLength, this.yOrig + this.neckWidth);
      this.ctx.stroke();
    }

    this.ctx.font = this.labelFont;
    if (this.showStringLabels) {
      for (let i=0; i<this.numberOfStrings; i++) {
        this.ctx.fillText(this.stringLabels[i], 5, this.yOrig + 5 + i*this.stringSeparation);
      }
    }

    if (this.showFretLabels) {
      let xOffsetFretLabel = 17;
      let yOffsetFretLabel = 15;
      for (let j=0; j<parseInt(this.numberOfFrets); j++) {
        this.ctx.fillText(this.startFret + j, this.xFretOrig + xOffsetFretLabel + j*this.fretLength, this.yOrig + this.neckWidth + yOffsetFretLabel);
      }
    }
    // recuperar tipografía
    this.ctx.font = this.savedCtxFont;
    this.ready = true;
  };

  this.drawString = function(stringFret, idx) {
    let fret = stringFret.fret !== undefined ? stringFret.fret : false || stringFret == 'X' ? 'X' : parseInt(stringFret);
    const label = stringFret.label || false;
    let bar = stringFret.bar !== undefined ? stringFret.bar : false || new String(stringFret).indexOf('|') > -1;
    if (typeof bar === 'boolean' && bar) { // era un string separado
      let barAndFret = new String(stringFret).split('|', 2);
      bar = barAndFret[0];
      fret = barAndFret[1] == '' ? undefined: barAndFret[1];
    }

    if ((fret === 0 || fret === '0') && !bar) {
      return;
    }

    let y = parseInt(this.yOrig + idx*this.stringSeparation);
    let x = this.xOrig + (this.xFretOrig-this.xOrig)/2;

    if (fret == 'X') {
      this.ctx.font = 'bold 20px sans-serif';
      this.ctx.fillStyle = this.noStringColour;

      this.ctx.fillText('X', x-8, y + parseInt(this.stringSeparation*0.3));

      this.ctx.font = this.savedCtxFont;
      this.ctx.fillStyle = this.savedCtxFillStyle;
      return;
    }


    // cejillo
    if (bar) {
      let xbar = parseInt((bar - this.startFret+ 0.5)*this.fretLength + this.xFretOrig);
      let dy = this.stringSeparation/2;
      this.ctx.lineWidth = this.barLineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(xbar, y - dy);
      this.ctx.lineTo(xbar, y + dy);
      this.ctx.stroke();
      this.ctx.lineWidth = this.savedLineWidth;
    }

    if (fret === undefined) {
      return;
    }

    x = parseInt((fret - this.startFret + 0.5)*this.fretLength + this.xFretOrig);

    const minFret = this.startFret;
    const maxFret = parseInt(minFret + this.numberOfFrets - 1);
    if (fret < minFret || fret > maxFret) {
      throw `Se está pulsando el traste ${fret} fuera del rango ${minFret}-${maxFret}.`;
    }

    // puntito
    let radius = parseInt(this.stringSeparation*0.4);
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2*Math.PI);
    this.ctx.fill();

    // etiqueta
    if (label !== false) {
      this.ctx.fillStyle = this.labelFingerColour;
      this.ctx.fillText(label, x + this.xOffsetFinger, y + this.yOffsetFinger);
      this.ctx.fillStyle = this.savedCtxFillStyle;
    }
  }

  this.draw = function (chord) {
    /*
    Un acorde es un arreglo de largo this.numberOfStrings.
    En cada cuerda, se puede especificar:
      - Una 'X', significando cuerda sin tocar.
      - Número de traste pulsado: debe ser un entero entre this.startFret y parseInt(this.numberOfFrets),
                                  o 0, significando cuerda al aire.

      - Número de traste pulsado, seguido de una '|', significando que se dibujará como un cejillo
        hecho con el dedo, seguido opcionalmente de un entero, significando otra cuerda a pulsar.
        Ejemplo: 1|3 significa que hay un dedo haciendo cejillo en el 1er traste, pero hay otro dedo
        presionando la cuerda en el 3er traste.

      - Un diccionario con las llaves 'fret' y 'label'. chord.fret debe ser un número de traste válido.
        chord.label será una etiqueta ubicada al interior del punto de presión (se sugiere usar números,
        o strings de un solo caracter). Opcionalmente, se puede pasar el el valor 'bar', el que debe ser
        un traste válido. Este valor será formateado como cejillo.
    */
    if (!this.ready) {
      this.init();
    }

    if (chord.length != this.numberOfStrings) {
      throw `Se esperaban ${this.numberOfStrings} cuerdas (se entregó ${chord.length}).`
    }

    for (let i=0; i<chord.length; i++) {
      /*
      this.drawString toma el índice de las cuerdas al revés (ej: Dm sería [1, 3, 2, 0, X, X]).
      */
      let stringFret = chord[i];
      this.drawString(stringFret, this.numberOfStrings - i - 1);
    }

    if (this.scale != 1) {
      this.ctx.restore();
    }
  }

}

function drawChord(cv, options, chord) {
  if (cv.getContext) {
    const ctx = cv.getContext('2d');

    function getNumericFrets(chord) {
      let frets = [];
      chord.forEach(function(stringFret) {
        if (stringFret.fret !== undefined) {
          frets.push(stringFret.fret);
        }
        if (stringFret.bar !== undefined) {
          frets.push(stringFret.bar);
        }

        let pipeIndex = String(stringFret).indexOf('|');
        if (pipeIndex > -1) {
          let barAndFret = stringFret.split('|');
          if (!isNaN(parseInt(barAndFret[0]))) {
            frets.push(parseInt(barAndFret[0]));
          }
          if (!isNaN(parseInt(barAndFret[1]))) {
            frets.push(parseInt(barAndFret[1]));
          }
        } else if (!isNaN(parseInt(stringFret))) {
          frets.push(parseInt(stringFret));
        }
      });
      return frets;
    }

    const numericFrets = getNumericFrets(chord);
    let minFret = Math.min.apply(null, numericFrets);
    let maxFret = Math.max.apply(null, numericFrets);

    options = JSON.parse(JSON.stringify(options));
    if (options.startFret === undefined) {
      if (minFret <= 2) {
        options.startFret = 0;
      } else {
        options.startFret = minFret - 1;
      }
    }
    //console.log('chord:', chord, 'minFret:', minFret, 'maxFret:', maxFret, 'numFrets: ', numericFrets, 'startFret:', options.startFret);

    if (options.numberOfFrets === undefined) {
      let minNumberOfFrets = maxFret - minFret + 1;
      options.numberOfFrets = Math.max(minNumberOfFrets, 4);
    }

    let diag = new ChordDiagram(ctx, options);
    diag.draw(chord);
  } else {
    alert('Canvas no soportado');
  }
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

      let chords = rawChordLine.split('|');
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

    drawChord(canvas, this.options, chord);

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

