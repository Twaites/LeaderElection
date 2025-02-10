"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function logEvent(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}
exports.default = logEvent;
