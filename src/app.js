class AppManager {
  constructor(e, t, i, o) {
    this.size = e;
    this.inputManager = new t();
    this.storageManager = new o();
    this.actuator = new i();
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("next", this.next.bind(this));
    this.setup();
  }
  restart() {
    this.storageManager.clearState();
    this.setup();
  }
  next() {
    const i = this.grid.randomAvailableCell();
    if (!!i) {
      const t = this.grid.getCellByIndex(i)[0];
      this.actuator.updateTotal((this.total = this.grid.addCell(t)));
      this.actuator.addCell(t);
      this.actuator.updateDisplay(this.grid.cells.added);
      this.storageManager.setState(this.serialize());
    }
  }
  setup() {
    let e = this.storageManager.getState();
    if (e) {
      this.grid = new Grid(e.grid.size, e.grid.cells);
      this.total = e.total;
    } else {
      this.grid = new Grid(this.size);
      this.total = 0;
    }
    this.actuate();
  }
  actuate() {
    if (this.over) {
      this.storageManager.clearState();
    } else {
      this.storageManager.setState(this.serialize());
    }

    this.actuator.actuate(this.grid, { total: this.total });
  }
  serialize() {
    return {
      grid: this.grid.serialize(),
      total: this.total,
    };
  }
  isGameTerminated() {
    return this.over || (this.won && !this.keepPlaying);
  }
}

class Grid {
  constructor(e, t) {
    this.size = e;
    this.cells = t || this.empty();
  }
  empty() {
    const e = { available: [], added: [] };
    for (let y = 0; y < this.size.rows; y++) {
      for (let x = 0; x < this.size.cols; x++) {
        const pos = { x, y };
        const val = y * this.size.cols + x + 1;
        e.available.push({ pos, val });
      }
    }
    return e;
  }
  serialize() {
    return {
      size: this.size,
      cells: this.cells,
    };
  }
  randomAvailableCell() {
    let e = this.cells.available.length;
    if (e) {
      return Math.floor(Math.random() * e);
    }
  }
  getCellByIndex(e) {
    return this.cells.available.splice(e, 1);
  }
  addCell(e) {
    return this.cells.added.unshift(e);
  }
}

class HTMLActuator {
  constructor() {
    this.tileContainer = ".tile-container";
    this.currentNumber = ".current-number span";
    this.last5 = ".last-5 div";
    this.totalNumber = ".total-number";
  }
  actuate(e, t) {
    const i = this;
    window.requestAnimationFrame(() => {
      i.clearContainer(i.tileContainer);
      e.cells.added.forEach((e) => {
        e && i.addCell(e);
      });
      i.updateTotal(t.total);
      i.clearContainer(i.currentNumber);
      i.clearContainer(i.last5);
      i.updateDisplay(e.cells.added);
    });
  }
  clearContainer(e) {
    $(e).empty();
  }
  updateTotal(e) {
    $(this.totalNumber).text(e);
  }
  updateDisplay(e) {
    e[0] && $(this.currentNumber).text(e[0].val);
    for (let i = 0; i < 5; i++) {
      const n = e[i];
      n && $($(this.last5)[4 - i]).text(n.val);
    }
  }
  addCell({ pos, val }) {
    const i = $("<div>");
    i.css({ "--x": pos.x, "--y": pos.y });
    i.addClass("tile");
    i.text(val);
    $(this.tileContainer).append(i);
  }
}

class KeyboardInputManager {
  constructor() {
    this.events = {};
    this.listen();
  }
  on(e, t) {
    if (!this.events[e]) this.events[e] = [];
    this.events[e].push(t);
  }
  emit(e, t) {
    if (this.events[e]) {
      this.events[e].forEach((e) => {
        e(t);
      });
    }
  }
  listen() {
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".next-button", this.next);
  }
  bindButtonPress(e, t) {
    $(e).click(t.bind(this));
  }
  restart(e) {
    e.preventDefault();
    this.emit("restart");
  }
  next(e) {
    e.preventDefault();
    this.emit("next");
  }
}

class LocalStorageManager {
  constructor() {
    this.stateKey = "state";
    this.storage = this.localStorageSupported()
      ? window.localStorage
      : window.fakeStorage;
  }
  localStorageSupported() {
    let e = "test";
    let t = window.localStorage;
    try {
      return t.setItem(e, "1"), t.removeItem(e), true;
    } catch (e) {
      return false;
    }
  }
  getState() {
    let e = this.storage.getItem(this.stateKey);
    return e ? JSON.parse(e) : null;
  }
  setState(e) {
    this.storage.setItem(this.stateKey, JSON.stringify(e));
  }
  clearState() {
    this.storage.removeItem(this.stateKey);
  }
}

const createGrid = (e) => {
  const n = $(".grid-container");
  for (let t = 0; t < e.rows; t++) {
    for (let o = 0; o < e.cols; o++) {
      n.append($("<div class='grid-cell'></div>"));
    }
  }
};

const runApplication = () => {
  const SIZE = { cols: 10, rows: 9 };
  new AppManager(SIZE, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  createGrid(SIZE);
};

$(document).ready(() => {
  window.requestAnimationFrame(() => {
    runApplication();
  });
});
