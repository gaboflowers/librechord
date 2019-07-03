function ChordDefinitions(options) {
    options = options || {};
    this.showLabels = options.showLabels || true;
    this.offset = options.offset || 0;

    this.semitonesDown = {
        'C': 'B',
        'C#': 'C',
        'D': 'C#',
        'D#': 'D',
        'E': 'D#',
        'F': 'E',
        'F#': 'F',
        'G': 'F#',
        'G#': 'G',
        'A': 'G#',
        'A#': 'A',
        'B': 'A#',
    };

    this.oneToneDown = function (note) {
        return this.semitonesDown[this.semitonesDown[note]];
    };

    this.deflat = function (chordName) {
        let toks = chordName.split('');
        if (toks[1] != 'b') {
            throw `Acorde ${chordName} no está en forma bemol.`;
        }

        let newChordName = this.semitonesDown[toks[0]];
        return newChordName + toks.slice(2).join('');
    };

    this.transposeFret = function (fret, semitones) {
        if (fret == 'X') return 'X';
        let stringFret = new String(fret);
        if (/^\d+$/.test(stringFret)) { // fret es un entero
            let transposed = parseInt(fret) + semitones;
            if (parseInt(fret) == 0 && semitones > 0) { // si era 0 (y se traspone hacia adelante), hay que hacer cejillo
                return transposed + '|'
            }
            return transposed;
        }
        if (/^\d+\|\d*$/.test(stringFret)) { // fret es un string cejillo
            let parts = stringFret.split('|');
            let newBar = parseInt(parts[0]) + semitones;
            let newFret = parts[1] == '' ? '' : parseInt(parts[1]) + semitones;
            return newBar + '|' + newFret;
        }
        // fret es un diccionario
        let fretDict = JSON.parse(JSON.stringify(fret));
        let properFret = fretDict.fret;
        fretDict.fret = parseInt(properFret) + semitones;
        return fretDict;
    };

    this.isBar = function (stringFret) {
        if (stringFret.hasOwnProperty('bar')) {
            return true;
        }
        if (new String(stringFret).indexOf('|') > -1) {
            return true;
        }
        return false;
    }

    this.getBar = function (stringFret) {
        if (stringFret.hasOwnProperty('bar')) {
            return stringFret.bar;
        }
        return stringFret.split('|', 1)[0];
    }

    const gcd = this;
    this.sanitiseBar = function (chord) {
        // Vuelve continuo un cejilo discontinuo (suele pasar después de trasponer)
        let barStrings = [];
        chord.forEach(function(stringFret, idx) {
            if (gcd.isBar(stringFret)) {
                barStrings.push({'bar': gcd.getBar(stringFret),
                                 'string': idx});
            }
        });

        if (barStrings.length == 0) {
            return chord;
        }

        const aBar = barStrings[0].bar;
        if (parseInt(aBar) == 0) {
            return chord;
        }

        if (!barStrings.every((bs) => bs.bar == aBar)) {
            return chord;
        }

        const minStringBar = barStrings[0].string;
        const maxStringBar = barStrings[barStrings.length - 1].string;
        for (let i=minStringBar; i<=maxStringBar; i++) {
            let stringFret = chord[i];
            if (!this.isBar(stringFret)) {
                if (stringFret.hasOwnProperty('fret')) {
                    chord[i].bar = aBar;
                } else {
                    chord[i] = aBar + '|' + stringFret;
                }
            }
        }

        return chord;
    }

    this.transposeChord = function (chord, semitones) {
        return this.sanitiseBar(chord.map((fret) => this.transposeFret(fret, semitones)));
    };

    this.getChord = function (chordName) {
        throw 'Este método debe ser overrideado por otro';
    };
}

function GuitarChordDefinitions(options) {
    ChordDefinitions.call(this, options);

    this.definitions = {
        // A
        'A': ['X', 0, {fret: 2, label: 1}, {fret:2, label: 2}, {fret: 2, label: 3}, 0],
        'Am': ['X', 0, {fret: 2, label: 2}, {fret:2, label: 3}, {fret: 1, label: 1}, 0],
        'A7': ['X', 0, {fret: 2, label: 1}, 0, {fret: 2, label: 3}, 0],
        'Am7': ['X', 0, {fret: 2, label: 2}, 0, {fret: 1, label: 1}, 0],
        'A#': ['X', '1|', {fret: 3, label: 2}, {fret:3, label: 3}, {fret: 3, label: 4}, '1|'],
        'A#m': ['X', '1|', {fret: 3, label: 3}, {fret:3, label: 4}, {fret: 2, label: 2}, '1|'],
        'A#7': ['X', '1|', {fret: 3, label: 2}, '1|', {fret: 3, label: 4}, '1|'],
        'A#m7': ['X', '1|', {fret: 3, label: 3}, '1|', {fret: 2, label: 2}, '1|'],
        // B se define desde A trasladado en 2 semitonos
        // C
        'C': ['X', {fret: 3, label: 3}, {fret: 2, label: 2}, 0, {fret: 1, label: 1}, 0],
        'Cm': [0, '3|', {fret: 5, label: 3, bar: 3}, {fret: 5, label: 4, bar: 3}, {fret: 4, label: 2, bar: 3}, '3|'],
        'C7': ['X', {fret: 3, label: 3}, {fret: 2, label: 2}, {fret: 3, label: 4}, {fret: 1, label: 1}, 0],
        'Cm7': ['X', '3|', {fret: 5, label: 3, bar: 3}, '3|', {fret: 4, label: 2, bar: 3}, '3|'],
        'C#': ['4|', '4|', {fret: 6, label: 2, bar: 4}, {fret: 6, label: 3, bar: 4}, {fret: 6, label: 4, bar: 4}, '4|'],
        'C#m': ['X', '4|', {fret: 6, label: 3, bar: 4}, {fret: 6, label: 4, bar: 4}, {fret: 5, label: 2, bar: 4}, '4|'],
        'C#7': ['X', '4|', {fret: 6, label: 3, bar: 4}, '4|', {fret: 6, label: 4, bar: 4}, '4|'],
        'C#7m': ['X', '4|', {fret: 6, label: 3, bar: 4}, '4|', {fret: 5, label: 4, bar: 4}, '4|'],
        // D
        'D': ['X', 'X', 0, {fret: 2, label: 1}, {fret: 3, label: 3}, {fret: 2, label: 2}],
        'Dm': ['X', 'X', 0, {fret: 2, label: 2}, {fret: 3, label: 3}, {fret: 1, label: 1}],
        'D7': ['X', 'X', 0, {fret: 2, label: 2}, {fret: 1, label: 1}, {fret: 2, label: 3}],
        'Dm7': ['X', 'X', 0, {fret: 2, label: 2}, '1|', '1|'],
        'D#': ['X', 'X', '1|', {fret: 3, label: 2}, {fret: 4, label: 4}, {fret: 3, label: 3}],
        'D#m': ['X', 'X', '1|', {fret: 3, label: 3}, {fret: 4, label: 4}, {fret: 2, label: 2}],
        'D#7': ['X', 'X', '1|', {fret: 3, label: 3}, {fret: 2, label: 4}, {fret: 3, label: 4}],
        'D#m7': ['X', 'X', {fret: 1, label: 1}, {fret: 3, label: 3}, '2|', '2|'],
        // E
        'E': [0, {fret: 2, label: 2}, {fret: 2, label: 3}, {fret: 1, label: 1}, 0, 0],
        'Em': [0, {fret: 2, label: 2}, {fret: 2, label: 3}, 0, 0, 0],
        'E7': [0, {fret: 2, label: 2}, 0, {fret: 1, label: 1}, 0, 0],
        'Em7': [0, {fret: 2, label: 2}, 0, 0, 0, 0],
        // F se define desde E trasladado en 1 semitono, F# en 2
        'G': [{fret: 3, label: 2}, {fret: 2, label: 1}, 0, 0, 0, {fret: 3, label: 3}],
        'G7': [{fret: 3, label: 3}, {fret: 2, label: 2}, 0, 0, 0, {fret: 2, label: 1}],
        // El resto de G se define desde E trasladado en 3 (o más) semitonos
    };

    this.transposedDefinition = function (chordName) {
        const baseNote = chordName[0];
        const baseWithAccidental = chordName.substr(0, 2);
        const chordSurname = chordName.substr(1);
        const chordAccidentalSurname = chordName.substr(2);
        console.log('chordname', chordName);

        if (baseNote == 'B') {
            return this.transposeChord(this.definitions['B'+chordSurname], 2);
        }

        if (baseWithAccidental == 'F#') {
            return this.transposeChord(this.definitions['E'+chordAccidentalSurname], 2);
        }
        if (baseNote == 'F') {
            return this.transposeChord(this.definitions['E'+chordSurname], 1);
        }

        if (baseWithAccidental == 'G#') {
            return this.transposeChord(this.definitions['E'+chordAccidentalSurname], 4);
        }

        if (baseNote == 'G') {
            return this.transposeChord(this.definitions['E'+chordSurname], 3);
        }

        throw `Acorde \'${chordName}\' no encontrado.`;
    }

    this.getChord = function (chordName) {
        if (!/^[CDEFGAB][#b]?m?7?$/.test(chordName)) { // Formas de acordes aceptadas
            return false;
        }

        if (/^[CDEFGAB]bm?7?$/.test(chordName)) {
            chordName = this.deflat(chordName); // pasar de forma bemol a sostenido (o natural)
        }

        if (['A', 'C', 'D', 'E'].indexOf(chordName[0]) > -1 || ['G', 'G7'].indexOf(chordName) > -1) {
            // acordes directos
            return this.transposeChord(this.definitions[chordName], this.offset);
        }

        return this.transposeChord(this.transposedDefinition(chordName), this.offset);
    };
}

