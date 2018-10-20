"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.actionCreator = actionCreator;
exports.connect = connect;
exports.create = create;

var _redux = require("redux");

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require("react-redux");

var _reselect = require("reselect");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actions = {};
var commonSelectors = {};
var defaultSelector = function defaultSelector(x) {
  return x;
};
var types = {
  dispatch: "@@dispatch"
};
var actionId = new Date().getTime();

function createStateMapper(prop) {
  if (prop[0] === "@") {
    prop = prop.substr(1);
    return function (state, props) {
      return props[prop];
    };
  }
  return function (state) {
    return state[prop];
  };
}

function actionCreator(action) {
  if (typeof action === "function") {
    if (!action.__actionId) {
      action.__actionId = "@@" + action.name + "_" + actionId++;
    }
    var actionMetadata = actions[action.__actionId];
    if (!actionMetadata) {
      actions[action.__actionId] = actionMetadata = {
        handler: action,
        creator: function creator(payload) {
          return { type: action.__actionId, payload: payload };
        }
      };
    }

    return actionMetadata.creator;
  }
  var actionCreators = {};
  Object.entries(action).forEach(function (pair) {
    return actionCreators[pair[0]] = actionCreator(pair[1]);
  });
  return actionCreators;
}

function connect(mapStateToProps) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (mapStateToProps) {
    // support named props
    if (typeof mapStateToProps === "string") {
      var props = mapStateToProps.split(/\s+/);
      var structuredSelector = {};
      props.forEach(function (prop) {
        return structuredSelector[prop[0] === "@" ? prop.substr(1) : prop] = commonSelectors[prop] || (commonSelectors[prop] = (0, _reselect.createSelector)(createStateMapper(prop), defaultSelector));
      });
      mapStateToProps = structuredSelector;
    }
    if (typeof mapStateToProps !== "function") {
      return _reactRedux.connect.apply(undefined, [(0, _reselect.createStructuredSelector)(mapStateToProps)].concat(args));
    }
  }

  return _reactRedux.connect.apply(undefined, [mapStateToProps].concat(args));
}

function create() {
  var initialState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var currentReducer = void 0;

  var lazyDispatch = function lazyDispatch(state) {
    for (var _len3 = arguments.length, actions = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      actions[_key3 - 1] = arguments[_key3];
    }

    return { type: types.dispatch, state: state, actions: actions };
  };
  var defaultReducer = function defaultReducer() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];

    // is custom action
    if (action.type in actions) {
      var actionHandler = actions[action.type].handler;
      var actionResult = actionHandler(state, action.payload, lazyDispatch);

      if (actionResult && actionResult.type === types.dispatch) {
        setTimeout(function () {
          actionResult.actions.forEach(function (action) {
            return store.dispatch(action);
          });
        }, 0);
        return actionResult.state;
      }
      return actionResult;
    }
    return currentReducer ? currentReducer(state, action) : state;
  };

  for (var _len2 = arguments.length, middlewares = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    middlewares[_key2 - 1] = arguments[_key2];
  }

  var store = middlewares.length ? // create store with middlewares
  (0, _redux.createStore)(defaultReducer, _redux.applyMiddleware.apply(undefined, middlewares)) : (0, _redux.createStore)(defaultReducer);

  return Object.assign({}, store, {
    // register reducer
    reducer: function reducer(_reducer) {
      if (typeof _reducer !== "function") {
        _reducer = (0, _redux.combineReducers)(_reducer);
      }
      if (currentReducer) {
        var prevReducer = currentReducer;
        currentReducer = function currentReducer(state, action) {
          return _reducer(prevReducer(state, action), action);
        };
      } else {
        currentReducer = _reducer;
      }
    },
    Provider: function Provider(props) {
      return _react2.default.createElement(_reactRedux.Provider, Object.assign({ store: store }, props));
    }
  });
}

exports.default = create;
//# sourceMappingURL=index.js.map