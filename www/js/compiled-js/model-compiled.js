"use strict";

/**
 * Created by UTOPIA SOFTWARE on [DATE].
 */

// define the model namespace
utopiasoftware[utopiasoftware_app_namespace].model = {

  /**
   * property acts as a flag that indicates that all hybrid plugins and DOM content
   * have been successfully loaded. It relies on the ons.ready() method
   *
   * @type {boolean} flag for if the hybrid plugins and DOM content are ready for execution
   */
  isAppReady: false

};

// call the method to startup the app
utopiasoftware[utopiasoftware_app_namespace].controller.startup();

/*// listen for the initialisation of the SIGNUP page
$(document).on("init", "#signup-page", utopiasoftware.emap.controller.signupPageViewModel.pageInit);

// listen for when the SIGNUP page is shown
$(document).on("show", "#signup-page", utopiasoftware.emap.controller.signupPageViewModel.pageShow);

// listen for when the SIGNUP page is hidden
$(document).on("hide", "#signup-page", utopiasoftware.emap.controller.signupPageViewModel.pageHide);

// listen for when the SIGNUP page is destroyed
$(document).on("destroy", "#signup-page", utopiasoftware.emap.controller.signupPageViewModel.pageDestroy);*/

//# sourceMappingURL=model-compiled.js.map