/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function (aGlobal) {
  Components.utils.import('resource://gre/modules/Services.jsm');

  var NoDelete = {
    getTargetFolder: function(aFolder) {
      var folders = aFolder ? [aFolder] :
                    gFolderTreeView ? gFolderTreeView.getSelectedFolders() : // messenger.xul
                    gFolderDisplay.displayedFolder ; // messageWindow.xul
      return folders[0];
    },

    isEmpty: function(aFolder) {
      return !aFolder.hasSubFolders && aFolder.getTotalMessages(false) === 0;
    },

    isInTrash: function(aFolder) {
      if (!aFolder)
        return false;

      if (aFolder.flags & Ci.nsMsgFolderFlags.Trash)
        return true;

      return this.isInTrash(aFolder.parent);
    },

    isCommandDisabled: function(aCommand) {
      switch (aCommand) {
        case 'cmd_shiftDelete':
        case 'button_shiftDelete':
          return true;

        case 'cmd_delete':
        case 'button_delete':
          return this.isInTrash(this.getTargetFolder());
      }

      return false;
    },

    init: function() {
      window.__no_delete__goDoCommand = window.goDoCommand;
      window.goDoCommand = function(aCommand) {
        if (NoDelete.isCommandDisabled(aCommand))
          return;
        return window.__no_delete__goDoCommand.call(this, aCommand);
      };

      window.FolderPaneController.__no_delete__supportsCommand = window.FolderPaneController.supportsCommand;
      window.FolderPaneController.supportsCommand = function(aCommand) {
        if (NoDelete.isCommandDisabled(aCommand))
          return false;
        return window.FolderPaneController.__no_delete__supportsCommand.call(this, aCommand);
      };

      window.FolderPaneController.__no_delete__isCommandEnabled = window.FolderPaneController.isCommandEnabled;
      window.FolderPaneController.isCommandEnabled = function(aCommand) {
        if (NoDelete.isCommandDisabled(aCommand))
          return false;
        return window.FolderPaneController.__no_delete__isCommandEnabled.call(this, aCommand);
      };

      window.DefaultController.__no_delete__supportsCommand = window.DefaultController.supportsCommand;
      window.DefaultController.supportsCommand = function(aCommand) {
        if (NoDelete.isCommandDisabled(aCommand))
          return false;
        return window.DefaultController.__no_delete__supportsCommand.call(this, aCommand);
      };

      window.DefaultController.__no_delete__isCommandEnabled = window.DefaultController.isCommandEnabled;
      window.DefaultController.isCommandEnabled = function(aCommand) {
        if (NoDelete.isCommandDisabled(aCommand))
          return false;
        return window.DefaultController.__no_delete__isCommandEnabled.call(this, aCommand);
      };

      window.DefaultController.__no_delete__doCommand = window.DefaultController.doCommand;
      window.DefaultController.doCommand = function(aCommand, aTab) {
        if (NoDelete.isCommandDisabled(aCommand))
          return false;
        return window.DefaultController.__no_delete__doCommand.call(this, aCommand, aTab);
      };
    }
  };

  document.addEventListener('DOMContentLoaded', function onDOMContentLoaded(aEvent) {
    document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
    NoDelete.init();
  });

  aGlobal.NoDelete = NoDelete;
})(this);
