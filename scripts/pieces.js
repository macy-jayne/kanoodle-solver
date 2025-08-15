const pieces = [
    { id: 'gray', color: '#BDBDBD', shape: [[1, 0], [1, 1], [0, 1], [2, 1], [1, 2]], letter: 'A',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
          ]
     },
    { id: 'magenta', color: '#E60585', shape: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]], letter: 'B',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
            { rotation: 0, flippedH: true, flippedV: false },
            { rotation: 90, flippedH: true, flippedV: false },
            { rotation: 180, flippedH: true, flippedV: false },
            { rotation: 270, flippedH: true, flippedV: false },
          ]
     },
    { id: 'darkGreen', color: '#0D9359', shape: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]], letter: 'C',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
            { rotation: 0, flippedH: true, flippedV: false },
            { rotation: 90, flippedH: true, flippedV: false },
            { rotation: 180, flippedH: true, flippedV: false },
            { rotation: 270, flippedH: true, flippedV: false },
          ]
     },
    { id: 'lightBlue', color: '#96D4D9', shape: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], letter: 'D',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
          ]
     },
    { id: 'yellow', color: '#FEEF17', shape: [[0, 0], [1, 0], [1, 1], [1, 2], [0, 2]], letter: 'E',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
          ]
     },
    { id: 'red', color: '#E80124', shape: [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1]], letter: 'F',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
            { rotation: 0, flippedH: true, flippedV: false },
            { rotation: 90, flippedH: true, flippedV: false },
            { rotation: 180, flippedH: true, flippedV: false },
            { rotation: 270, flippedH: true, flippedV: false },
          ]
     },
    { id: 'lightPink', color: '#FFCDCD', shape: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]], letter: 'G',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
            { rotation: 0, flippedH: true, flippedV: false },
            { rotation: 90, flippedH: true, flippedV: false },
            { rotation: 180, flippedH: true, flippedV: false },
            { rotation: 270, flippedH: true, flippedV: false },
          ]
     },
    { id: 'darkBlue', color: '#2D0D9A', shape: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]], letter: 'H',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
            { rotation: 0, flippedH: true, flippedV: false },
            { rotation: 90, flippedH: true, flippedV: false },
            { rotation: 180, flippedH: true, flippedV: false },
            { rotation: 270, flippedH: true, flippedV: false },
          ]
     },
    { id: 'orange', color: '#FF5E00', shape: [[0, 0], [1, 0], [2, 0], [2, 1]], letter: 'I',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
            { rotation: 0, flippedH: true, flippedV: false },
            { rotation: 90, flippedH: true, flippedV: false },
            { rotation: 180, flippedH: true, flippedV: false },
            { rotation: 270, flippedH: true, flippedV: false },
          ]
     },
    { id: 'purple', color: '#760E97', shape: [[0, 0], [1, 0], [2, 0], [3, 0]], letter: 'J',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
          ]
     },
    { id: 'lime', color: '#09FD26', shape: [[0, 0], [1, 0], [1, 1], [0, 1]], letter: 'K',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
          ]
     },
    { id: 'mickey', color: '#F3F3F3', shape: [[0, 0], [1, 0], [1, 1]], letter: 'L',
        allowedTransforms: [
            { rotation: 0, flippedH: false, flippedV: false },
            { rotation: 90, flippedH: false, flippedV: false },
            { rotation: 180, flippedH: false, flippedV: false },
            { rotation: 270, flippedH: false, flippedV: false },
          ]
     }
];

const pieceTransforms = {};
// Track placed pieces on the board: id => { baseRow, baseCol }
placedPieces = {};