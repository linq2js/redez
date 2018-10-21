# redez

A lightweight wrapper for Redux. Enhance store, reducers and more.

## Features
1. Support modifying state by action
1. Support action handler
1. Dynamic adding reducer
1. Support state mapping by props string literal

## Counter app

```jsx harmony
import React from "react";
import { render } from "react-dom";
import create, { actionCreator, connect } from "redez";

const initialState = 0;

const actions = actionCreator({
  increase: state => state + 1,
  decrease: state => state - 1
});

const app = create(initialState);

const Counter = connect(
  state => ({ value: state }),
  actions
)(props => (
  <div>
    <h1>{props.value}</h1>
    <button onClick={props.increase}>+</button>
    <button onClick={props.decrease}>-</button>
  </div>
));

render(
  <app.Provider>
    <Counter />
  </app.Provider>,
  document.body
);
```

## Using middleware

```jsx harmony
function logger({ getState }) {
  return next => action => {
    console.log("will dispatch", action);

    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action);

    console.log("state after dispatch", getState());

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  };
}
// can pass multiple middleware
// create(initialState, ...middleware);
const app = create(initialState, logger);
```

## Using reducer

```jsx harmony
import React from "react";
import { render } from "react-dom";
import create, { connect } from "redez";

const initialState = 0;

const app = create(initialState);

app.reducer((state, action) => {
  if (action.type === "increase") return state + 1;
  if (action.type === "decrease") return state - 1;
  return state;
});

const Counter = connect(
  state => ({ value: state }),
  dispatch => ({
    increase: () => dispatch({ type: "increase" }),
    decrease: () => dispatch({ type: "decrease" })
  })
)(props => (
  <div>
    <h1>{props.value}</h1>
    <button onClick={props.increase}>+</button>
    <button onClick={props.decrease}>-</button>
  </div>
));

render(
  <app.Provider>
    <Counter />
  </app.Provider>,
  document.body
);
```

## Using string as mapStateToProps

```jsx harmony
connect("todos @todoId");
// equivalent to
connect((state, props) => {
  return {
    todos: state.todos,
    todoId: props.todoId
  };
});
```

## Dispatch other actions in action body

```jsx harmony
import { actionCreator } from "redez";
import OtherAction from "./actions/OtherAction";

const actions = actionCreator({
  other: OtherAction
});

// RIGHT WAY
const MyAction = (state, payload, dispatch) => {
  const newState = {
    ...state
    // change somethings
  };
  const otherActionPayload = {};
  return dispatch(state, actions.other(otherActionPayload));
};

// WRONG WAY
const MyAction = (state, payload, dispatch) => {
  const newState = {
    ...state
    // change somethings
  };
  fetch("http://tempuri.org")
    .then(res => res.json())
    .then(res => {
      const otherActionPayload = {};
      // nothing dispatch here
      dispatch(state, actions.other(otherActionPayload));
    });
};
```

## Using actionHandler to handle ajax action

```jsx harmony
// AjaxActionCreator.js
const ajaxHandler = actionHandler((store, next, action) => {
  if (action.type === 'ajax') {
    fetch(action.payload).then(
      res => res[action.payload.responseType]()
    ).then(
      // handle success
      res => action.onSuccess && store.dispatch(action.onSuccess(res)),
      // handle failure
      error => action.onFailure && store.dispatch(action.onFailure(error))
    );
  }
});
export default (options = {}) => ({
  type: "ajax",
  payload: options,
  handler: ajaxHandler
});

// LoadTodoAction.js
import { actionCreator } from 'redez';
import AjaxActionCreator from './AjaxActionCreator';
import TodoLoadedAction from './TodoLoadedAction';

const actions = actionCreator({ todoLoaded: TodoLoadedAction });

export default (state, action, dispatch) => {
  return dispatch(
    // nothing to change
    state,
    // dispatch ajax action
    AjaxActionCreator({
      url: 'TODO_LIST_API',
      responseType: 'json',
      onSuccess: actions.todoLoaded
    }));
};
```
