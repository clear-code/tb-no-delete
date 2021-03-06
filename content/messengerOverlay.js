/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function (aGlobal) {
  Components.utils.import('resource://gre/modules/Services.jsm');

  var NoDelete = {
    get debug() {
      return Services.prefs.getBoolPref('extensions.no-delete@clear-code.com.debug');
    },

    log: function(aMessage) {
      if (!this.debug)
        return;

     Services.console.logStringMessage('[no-delete] '+aMessage);
    },

    getTargetFolder: function(aFolder) {
      var folders = aFolder ? [aFolder] :
                    gFolderTreeView ? gFolderTreeView.getSelectedFolders() : // messenger.xul
                    [gFolderDisplay.displayedFolder] ; // messageWindow.xul
      this.log('target folder: '+(folders.length ? folders[0].folderURL : 'no target'));
      return folders[0];
    },

    isEmpty: function(aFolder) {
      return !aFolder.hasSubFolders && aFolder.getTotalMessages(false) === 0;
    },

    isInTrash: function(aFolder) {
      this.log('isInTrash: '+(aFolder ? aFolder.folderURL : 'no target'));
      if (!aFolder)
        return false;

      this.log('  flags     : '+(aFolder.flags));
      this.log('  trash flag: '+(aFolder.flags & Ci.nsMsgFolderFlags.Trash));
      if (aFolder.flags & Ci.nsMsgFolderFlags.Trash)
        return true;

      return this.isInTrash(aFolder.parent);
    },

    isCommandDisabled: function(aCommand) {
      this.log('isCommandDisabled: '+aCommand);
      switch (aCommand) {
        case 'cmd_shiftDelete':
        case 'button_shiftDelete':
          return true;

        case 'cmd_delete':
        case 'button_delete':
        case 'cmd_deleteJunk':
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

      if ('FolderPaneController' in window) {
        FolderPaneController.__no_delete__supportsCommand = FolderPaneController.supportsCommand;
          FolderPaneController.supportsCommand = function(aCommand) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return FolderPaneController.__no_delete__supportsCommand.call(this, aCommand);
        };

        FolderPaneController.__no_delete__isCommandEnabled = FolderPaneController.isCommandEnabled;
        FolderPaneController.isCommandEnabled = function(aCommand) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return FolderPaneController.__no_delete__isCommandEnabled.call(this, aCommand);
        };
      }

      if ('DefaultController' in window) {
        DefaultController.__no_delete__supportsCommand = DefaultController.supportsCommand;
        DefaultController.supportsCommand = function(aCommand) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return DefaultController.__no_delete__supportsCommand.call(this, aCommand);
        };

        DefaultController.__no_delete__isCommandEnabled = DefaultController.isCommandEnabled;
        DefaultController.isCommandEnabled = function(aCommand) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return DefaultController.__no_delete__isCommandEnabled.call(this, aCommand);
        };

        DefaultController.__no_delete__doCommand = DefaultController.doCommand;
        DefaultController.doCommand = function(aCommand, aTab) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return DefaultController.__no_delete__doCommand.call(this, aCommand, aTab);
        };
      }

      if ('MessageWindowController' in window) {
        MessageWindowController.__no_delete__supportsCommand = MessageWindowController.supportsCommand;
        MessageWindowController.supportsCommand = function(aCommand) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return MessageWindowController.__no_delete__supportsCommand.call(this, aCommand);
        };

        MessageWindowController.__no_delete__isCommandEnabled = MessageWindowController.isCommandEnabled;
        MessageWindowController.isCommandEnabled = function(aCommand) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return MessageWindowController.__no_delete__isCommandEnabled.call(this, aCommand);
        };

        MessageWindowController.__no_delete__doCommand = MessageWindowController.doCommand;
        MessageWindowController.doCommand = function(aCommand, aTab) {
          if (NoDelete.isCommandDisabled(aCommand))
            return false;
          return MessageWindowController.__no_delete__doCommand.call(this, aCommand, aTab);
        };
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function onDOMContentLoaded(aEvent) {
    document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
    NoDelete.init();
  });

  aGlobal.NoDelete = NoDelete;
})(this);
