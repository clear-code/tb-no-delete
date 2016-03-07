/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const kCID  = Components.ID('{2260c687-d061-4253-8589-8b32a1545943}'); 
const kID   = '@clear-code.com/no-delete/startup;1';
const kNAME = 'NoDeleteStartupService';

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
Components.utils.import('resource://gre/modules/Services.jsm');

function NoDeleteStartupService() { 
}
NoDeleteStartupService.prototype = {
	classID          : kCID,
	contractID       : kID,
	classDescription : kNAME,
	 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'profile-after-change':
				this.init();
				return;
		}
	},
 
	init : function() 
	{
		this.disableEmptyTrash();
	},

    disableEmptyTrash : function()
    {
    	this.getAccounts().forEach(function(aAccount) {
    		var server = Services.prefs.getCharPref('mail.account.' + aAccount + '.server');

    		this.lockBoolPref('mail.server.' + server + '.empty_trash_on_exit', false);
    		var type = Services.prefs.getCharPref('mail.server.' + server + '.type');
    		if (type !== 'none') {
	    		this.lockBoolPref('mail.server.' + server + '.purgeSpam', false);
	    	}
	    }, this);
	},

    getAccounts : function()
    {
		var accounts = Services.prefs.getCharPref('mail.accountmanager.accounts');
		accounts = decodeURIComponent(escape(accounts));
		return accounts.split(',');
	},

	lockBoolPref : function(aKey, aValue)
	{
		if (Services.prefs.prefIsLocked(aKey))
			Services.prefs.unlockPref(aKey);
    	var defaultBranch = Services.prefs.getDefaultBranch(null);
		defaultBranch.setBoolPref(aKey, aValue);
		Services.prefs.lockPref(aKey);
	},

	QueryInterface : XPCOMUtils.generateQI([Ci.nsIObserver]),
	_xpcom_categories : [
		{ category : 'profile-after-change', service : true }
	]
}; 
 	 
var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			kCID,
			kNAME,
			kID,
			aFileSpec,
			aLocation,
			aType
		);
	},

	getClassObject : function(aCompMgr, aCID, aIID)
	{
		return this.factory;
	},

	factory : {
		QueryInterface : function(aIID)
		{
			if (!aIID.equals(Components.interfaces.nsISupports) &&
				!aIID.equals(Components.interfaces.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		},
		createInstance : function(aOuter, aIID)
		{
			return new NoDeleteStartupService();
		}
	},

	canUnload : function(aCompMgr)
	{
		return true;
	}
};


var NSGetFactory = XPCOMUtils.generateNSGetFactory([NoDeleteStartupService]);
