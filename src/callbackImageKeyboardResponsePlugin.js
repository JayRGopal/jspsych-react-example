
/**
 * callback_image_keyboard_response
 * Indiamei Coren-Gold & Jay Gopal (April 2024)
 * modified from Teon L Brooks
 * modified from Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/
import { jsPsych } from "jspsych-react";

var plugin = (function() {
  var plugin = {};

  jsPsych.pluginAPI.registerPreload(
    "callbackImageKeyboardResponse",
    "stimulus",
    "image"
  );

  plugin.info = {
    name: "callbackImageKeyboardResponse",
    description: "",
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: "Stimulus",
        default: undefined,
        description: "The image to be displayed"
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: "Choices",
        default: jsPsych.ALL_KEYS,
        description:
          "The keys the subject is allowed to press to respond to the stimulus."
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Prompt",
        default: "",
        description: "Any content here will be displayed below the stimulus."
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus duration",
        default: -1,
        description: "How long to hide the stimulus."
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Trial duration",
        default: -1,
        description: "How long to show trial before it ends."
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: "Response ends trial",
        default: true,
        description: "If true, trial will end when subject makes a response."
      }
    }
  };

  plugin.trial = function(display_element, trial) {
    var new_html =
      '<img src="' +
      trial.stimulus +
      '" id="jspsych-callbackImageKeyboardResponse-stimulus"></img>';

    // add prompt
    new_html += trial.prompt;

    // add option for on_start parameter in the experiment
    if (typeof trial.on_start === "function") {
      trial.on_start.call();
    } else if (typeof trial.on_start !== "undefined") {
      trial.data["on_start"] = trial.on_start;
    }

    // draw
    display_element.innerHTML = new_html;

    // store response
    var response = {
      rt: -1,
      key: -1
    };

    // function to end trial when it is time
    var end_trial = function() {
      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== "undefined") {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
        stimulus: trial.stimulus,
        key_press: response.key
      };

      // clear the display
      display_element.innerHTML = "";

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(info) {
      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      display_element.querySelector(
        "#jspsych-callbackImageKeyboardResponse-stimulus"
      ).className +=
        " responded";

      // only record the first response
      console.log('responded! ', info);
      // Send the response data to a server endpoint
      const apiURL = "http://localhost:4000/saveTrial";
      fetch(apiURL, {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: info
        })
      }).then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      }).then(data => {
        console.log('Data successfully sent to the server:', data);
      }).catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });

      if (response.key == -1) {
        response = info;
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    // start the response listener
    if (trial.choices != jsPsych.NO_KEYS) {
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: "performance",
        persist: false,
        allow_held_key: false
      });
    }

    // hide stimulus if stimulus_duration is set
    if (trial.stimulus_duration > 0) {
      jsPsych.pluginAPI.setTimeout(function() {
        display_element.querySelector(
          "#jspsych-callbackImageKeyboardResponse-stimulus"
        ).style.visibility = "hidden";
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration > 0) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }
  };

  return plugin;
})(); // IIFE closure

export default plugin;
