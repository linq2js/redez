import { create, actionCreator, actionHandler, connect } from "./index";

describe("actionHandler", () => {
  test("using action handler to handle ajax request", () => {
    const ajaxHandler = actionHandler((store, next, action) => {
      expect(action).toEqual({
          type: 'ajax',
          payload: undefined,
          handler: ajaxHandler
      });
    });
    const ajaxActionCreator = options => ({
      type: "ajax",
      payload: options,
      handler: ajaxHandler
    });

    const app = create(0);
    app.dispatch(ajaxActionCreator());
  });
});
