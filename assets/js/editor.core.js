window.SBEditor = window.SBEditor || {};

window.SBEditor.state = {
  siteId: 0,
  pageId: 0,
  blocksBox: null,
  blockSearch: null,
  collapsedBlocks: new Set(),

  allPageBlocks: [],
  btnAddSection: null,
  btnAddText: null,
  btnAddImage: null,
  btnAddButton: null,
  btnAddHeading: null,
  btnAddCols2: null,
  btnAddGallery: null,
  btnAddSpacer: null,
  btnAddCard: null,
  btnAddCards: null,

  btnSaveTemplate: null,
  btnApplyTemplate: null,
  btnSections: null,
};

window.SBEditor.setState = function (patch) {
  Object.assign(window.SBEditor.state, patch || {});
};

window.SBEditor.getState = function () {
  return window.SBEditor.state;
};