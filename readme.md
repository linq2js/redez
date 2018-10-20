# redez

A lightweight wrapper for Redux. Enhance store and reducers

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
    console.log('will dispatch', action)
​
    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action)
​
    console.log('state after dispatch', getState())
​
    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
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
