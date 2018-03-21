/**
 * Created by UTOPIA SOFTWARE on [DATE].
 */

/**
 * file defines all View-Models, Controllers and Event Listeners used by the app
 *
 * The 'utopiasoftware_app_namespace' namespace variable has being defined in the base js file.
 * The author uses the terms 'method' and function interchangeably; likewise the terms 'attribute' and 'property' are
 * also used interchangeably
 */

// define the controller namespace
utopiasoftware[utopiasoftware_app_namespace].controller = {

    /**
     * property holds the Map objects which will contain a reference to dynamically loaded ES modules.
     * NOTE: modules MUST BE deleted from this property i.e. the Map object when no longer need.
     * This is to enable garbage collection and prevent memory leaks.
     * NOTE: the keys used within the map will be identical to the same map value used in the SystemJS.config()
     */
    LOADED_MODULES: new Map(),
    /**
     * method contains the stratup/bootstrap code needed to initiate app logic execution
     */
    startup: function(){

        // initialise the app libraries and plugins
        ons.ready(async function () {
            // set the default handler for the app
            ons.setDefaultDeviceBackButtonListener(function(){
                // does nothing for now!!
            });

            // displaying prepping message
            //$('#loader-modal-message').html("Loading App...");
            //$('#loader-modal').get(0).show(); // show loader

            if(false){ // there is a previous logged in user
                // load the login page
                $('ons-splitter').get(0).content.load("login-template");
            }
            else{ // no previous logged in user
                // load the signup page
                $('ons-splitter').get(0).content.load("signup-template");
            }



            // START ALL CORDOVA PLUGINS CONFIGURATIONS
            try{
                /*// lock the orientation of the device to 'PORTRAIT'
                 screen.lockOrientation('portrait');*/
            }
            catch(err){}

            try { // START ALL THE CORDOVA PLUGINS CONFIGURATION WHICH REQUIRE PROMISE SYNTAX

                // note: for most promises, we weill use async-wait syntax
                // var a = await Promise.all([SystemJS.import('@syncfusion/ej2-base'), SystemJS.import('@syncfusion/ej2-dropdowns')]);
            }
            catch(err){
            }
            finally{
                /*// set status bar color
                 StatusBar.backgroundColorByHexString("#DC723D");
                 navigator.splashscreen.hide(); // hide the splashscreen

                 utopiasoftware.emap.model.isAppReady = true; // true that app is fully loaded and ready*/
            }

        }); // end of ons.ready()

    },

    /**
     * this is the view-model/controller for the Sign Up page
     */
    signupPageViewModel: {}
};

//utopiasoftware[utopiasoftware_app_namespace].controller.startup();

