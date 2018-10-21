"use strict";

var _index = require("./index");

describe("actionHandler", function () {
  test("using action handler to handle ajax request", function () {
    var ajaxHandler = (0, _index.actionHandler)(function (store, next, action) {
      expect(action).toEqual({
        type: 'ajax',
        payload: undefined,
        handler: ajaxHandler
      });
    });
    var ajaxActionCreator = function ajaxActionCreator(options) {
      return {
        type: "ajax",
        payload: options,
        handler: ajaxHandler
      };
    };

    var app = (0, _index.create)(0);
    app.dispatch(ajaxActionCreator());
  });
});
//# sourceMappingURL=index.test.js.map