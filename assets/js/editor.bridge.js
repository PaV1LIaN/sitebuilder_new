window.SBEditor = window.SBEditor || {};

window.SBEditor.syncLegacyBridge = function () {
  const st = window.SBEditor.getState();

  window.siteId = st.siteId;
  window.pageId = st.pageId;
  window.blocksBox = st.blocksBox;
  window.blockSearch = st.blockSearch;
  window.collapsedBlocks = st.collapsedBlocks;
  window.allPageBlocks = st.allPageBlocks || [];

  window.notify = window.SBEditor.notify;
  window.api = window.SBEditor.api;

  window.fileDownloadUrl = function (fileId) {
    return window.SBEditor.fileDownloadUrl(window.SBEditor.getState().siteId, fileId);
  };

  window.getFilesForSite = function () {
    return window.SBEditor.getFilesForSite();
  };

  window.btnClass = window.SBEditor.btnClass;
  window.headingTag = window.SBEditor.headingTag;
  window.headingAlign = window.SBEditor.headingAlign;
  window.colsGridTemplate = window.SBEditor.colsGridTemplate;
  window.galleryTemplate = window.SBEditor.galleryTemplate;
  window.cardsNormalizeItem = window.SBEditor.cardsNormalizeItem;

  window.saveBlockOrder = window.SBEditor.saveBlockOrder;
  window.initBlockDnD = window.SBEditor.initBlockDnD;
  window.renderBlocks = window.SBEditor.renderBlocks;

  window.SECTION_PRESETS = window.SBEditor.SECTION_PRESETS;
  window.sectionPresetOptions = window.SBEditor.sectionPresetOptions;
  window.applySectionPresetToForm = window.SBEditor.applySectionPresetToForm;
  window.createBlockAfterSection = window.SBEditor.createBlockAfterSection;
  window.quickAddHeadingAfterSection = window.SBEditor.quickAddHeadingAfterSection;
  window.quickAddTextAfterSection = window.SBEditor.quickAddTextAfterSection;
  window.quickAddButtonAfterSection = window.SBEditor.quickAddButtonAfterSection;
  window.quickAddCardsAfterSection = window.SBEditor.quickAddCardsAfterSection;
  window.addSectionBlock = window.SBEditor.addSectionBlock;
  window.editSectionBlock = window.SBEditor.editSectionBlock;
};