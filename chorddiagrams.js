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
 * Provee la función drawChord(canvas, chord[, options) utilizada por
 * LChorder para dibujar el diagrama de un acorde.
 *
 * También puede utilizarse por separado, entregando un canvas y un
 * acorde válido.
 */

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

function drawChord(cv, chord, options) {
  options = options || {};

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

