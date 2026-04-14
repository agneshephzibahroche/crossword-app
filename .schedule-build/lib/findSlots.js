"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSlots = findSlots;
function findSlots(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const slots = [];
    let clueNumber = 1;
    const numberingMap = new Map();
    function getNumber(r, c) {
        const key = `${r}-${c}`;
        if (!numberingMap.has(key)) {
            numberingMap.set(key, clueNumber++);
        }
        return numberingMap.get(key);
    }
    function isOpen(r, c) {
        return grid[r][c] !== "#";
    }
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!isOpen(r, c))
                continue;
            const startsAcross = (c === 0 || grid[r][c - 1] === "#") &&
                c + 1 < cols &&
                grid[r][c + 1] !== "#";
            const startsDown = (r === 0 || grid[r - 1][c] === "#") &&
                r + 1 < rows &&
                grid[r + 1][c] !== "#";
            if (startsAcross) {
                let length = 0;
                let cc = c;
                while (cc < cols && grid[r][cc] !== "#") {
                    length++;
                    cc++;
                }
                slots.push({
                    number: getNumber(r, c),
                    row: r,
                    col: c,
                    direction: "across",
                    length,
                });
            }
            if (startsDown) {
                let length = 0;
                let rr = r;
                while (rr < rows && grid[rr][c] !== "#") {
                    length++;
                    rr++;
                }
                slots.push({
                    number: getNumber(r, c),
                    row: r,
                    col: c,
                    direction: "down",
                    length,
                });
            }
        }
    }
    return slots;
}
