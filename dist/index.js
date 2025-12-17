/******/ var __webpack_modules__ = ({

/***/ 746:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(746);


const openaiKey = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput("openai_api_key", { required: true });
const model = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput("model");
const reviewFile = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput("review_file");
const maxFiles = Number(_actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput("max_files"));

const { GITHUB_REPOSITORY, GITHUB_EVENT_PATH } = process.env;

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, "utf8"));
const prNumber = event.pull_request?.number;
if (!prNumber) {
  throw new Error("This action only works on pull_request events");
}

