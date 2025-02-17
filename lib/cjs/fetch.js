"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEventSource = exports.EventStreamContentType = void 0;
const parse_1 = require("./parse");
exports.EventStreamContentType = 'text/event-stream';
const DefaultRetryInterval = 1000;
const LastEventId = 'last-event-id';
function fetchEventSource(input, _a) {
    var { signal: inputSignal, headers: inputHeaders, onopen: inputOnOpen, onmessage, onclose, onerror, openWhenHidden, fetch: inputFetch } = _a, rest = __rest(_a, ["signal", "headers", "onopen", "onmessage", "onclose", "onerror", "openWhenHidden", "fetch"]);
    return new Promise((resolve, reject) => {
        var _a;
        const headers = Object.assign({}, inputHeaders);
        if (!headers.accept) {
            headers.accept = exports.EventStreamContentType;
        }
        let curRequestController;
        function onVisibilityChange() {
            var _a;
            curRequestController.abort();
            if (!((_a = self.document) === null || _a === void 0 ? void 0 : _a.hidden)) {
                create();
            }
        }
        if (self.document && !openWhenHidden) {
            (_a = self.document) === null || _a === void 0 ? void 0 : _a.addEventListener('visibilitychange', onVisibilityChange);
        }
        let retryInterval = DefaultRetryInterval;
        let retryTimer = 0;
        function dispose() {
            var _a;
            (_a = self.document) === null || _a === void 0 ? void 0 : _a.removeEventListener('visibilitychange', onVisibilityChange);
            self.clearTimeout(retryTimer);
            curRequestController.abort();
        }
        inputSignal === null || inputSignal === void 0 ? void 0 : inputSignal.addEventListener('abort', () => {
            dispose();
            resolve();
        });
        const fetch = inputFetch !== null && inputFetch !== void 0 ? inputFetch : self.fetch;
        const onopen = inputOnOpen !== null && inputOnOpen !== void 0 ? inputOnOpen : defaultOnOpen;
        async function create() {
            var _a;
            if (curRequestController) {
                curRequestController.abort();
            }
            curRequestController = new AbortController();
            try {
                const response = await fetch(input, Object.assign(Object.assign({}, rest), { headers, signal: curRequestController.signal }));
                await onopen(response);
                await parse_1.getBytes(response.body, parse_1.getLines(parse_1.getMessages(id => {
                    if (id) {
                        headers[LastEventId] = id;
                    }
                    else {
                        delete headers[LastEventId];
                    }
                }, retry => {
                    retryInterval = retry;
                }, onmessage)));
                onclose === null || onclose === void 0 ? void 0 : onclose();
                dispose();
                resolve();
            }
            catch (err) {
                if (!curRequestController.signal.aborted) {
                    try {
                        const interval = (_a = onerror === null || onerror === void 0 ? void 0 : onerror(err)) !== null && _a !== void 0 ? _a : retryInterval;
                        self.clearTimeout(retryTimer);
                        retryTimer = self.setTimeout(create, interval);
                    }
                    catch (innerErr) {
                        dispose();
                        reject(innerErr);
                    }
                }
            }
        }
        create();
    });
}
exports.fetchEventSource = fetchEventSource;
function defaultOnOpen(response) {
    const contentType = response.headers.get('content-type');
    if (!(contentType === null || contentType === void 0 ? void 0 : contentType.startsWith(exports.EventStreamContentType))) {
        throw new Error(`Expected content-type to be ${exports.EventStreamContentType}, Actual: ${contentType}`);
    }
}
//# sourceMappingURL=fetch.js.map