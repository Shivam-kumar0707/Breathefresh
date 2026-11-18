var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { getChatSystemPrompt, hasRedFlagSymptoms } from './_lib/prompts';
var ChatInputSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(600),
    })).max(6),
    contextPack: z.string(),
    language: z.enum(['en', 'hi', 'hinglish']).default('en'),
});
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var bodyData, parsed, _a, messages, contextPack, language, lastUserMsg, isRedFlag, alertMsg, fallbackMsg, systemPrompt, groqMessages, groqRes, reader, decoder, buffer, _b, done, value, lines, _i, lines_1, line, trimmed, dataStr, parsedChunk, content, err_1;
        var _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    res.setHeader('Access-Control-Allow-Origin', GROQ_CONFIG.allowedOrigin);
                    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    if (req.method === 'OPTIONS') {
                        res.statusCode = 204;
                        res.end();
                        return [2 /*return*/];
                    }
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
                        return [2 /*return*/];
                    }
                    bodyData = req.body;
                    if (!!bodyData) return [3 /*break*/, 2];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var data = '';
                            req.on('data', function (chunk) { return (data += chunk); });
                            req.on('end', function () {
                                try {
                                    resolve(JSON.parse(data));
                                }
                                catch (_a) {
                                    resolve({});
                                }
                            });
                        })];
                case 1:
                    bodyData = _h.sent();
                    _h.label = 2;
                case 2:
                    parsed = ChatInputSchema.safeParse(bodyData);
                    if (!parsed.success) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid chat payload' }));
                        return [2 /*return*/];
                    }
                    _a = parsed.data, messages = _a.messages, contextPack = _a.contextPack, language = _a.language;
                    lastUserMsg = ((_c = messages[messages.length - 1]) === null || _c === void 0 ? void 0 : _c.content) || '';
                    isRedFlag = hasRedFlagSymptoms(lastUserMsg);
                    res.setHeader('Content-Type', 'text/event-stream');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('Connection', 'keep-alive');
                    if (isRedFlag) {
                        alertMsg = 'CRITICAL MEDICAL ALERT: You have mentioned symptoms of severe distress (such as chest pain or severe breathlessness). Please seek immediate emergency medical care or call your local emergency service right now. Do not wait for indoor air adjustments.';
                        res.write("data: ".concat(JSON.stringify({ token: alertMsg, isRedFlag: true }), "\n\n"));
                        res.write('data: [DONE]\n\n');
                        res.end();
                        return [2 /*return*/];
                    }
                    // If no Groq key configured, stream rule-based assistant advice
                    if (!GROQ_CONFIG.apiKey) {
                        fallbackMsg = "I'm operating in zero-config offline mode. Based on your current air quality, keep your windows closed during morning smog peaks, run your indoor purifier if available, and limit strenuous outdoor workouts until the cleaner afternoon window.";
                        res.write("data: ".concat(JSON.stringify({ token: fallbackMsg }), "\n\n"));
                        res.write('data: [DONE]\n\n');
                        res.end();
                        return [2 /*return*/];
                    }
                    systemPrompt = getChatSystemPrompt(contextPack, language);
                    groqMessages = __spreadArray([
                        { role: 'system', content: systemPrompt }
                    ], messages.map(function (m) { return ({ role: m.role, content: m.content }); }), true);
                    _h.label = 3;
                case 3:
                    _h.trys.push([3, 8, , 9]);
                    return [4 /*yield*/, callGroq({
                            model: GROQ_CONFIG.modelFast,
                            messages: groqMessages,
                            stream: true,
                            maxTokens: 600,
                            temperature: 0.3,
                        })];
                case 4:
                    groqRes = _h.sent();
                    if (!groqRes.ok || !groqRes.body) {
                        throw new Error("Groq stream failed with status ".concat(groqRes.status));
                    }
                    reader = groqRes.body.getReader();
                    decoder = new TextDecoder();
                    buffer = '';
                    _h.label = 5;
                case 5:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, reader.read()];
                case 6:
                    _b = _h.sent(), done = _b.done, value = _b.value;
                    if (done)
                        return [3 /*break*/, 7];
                    buffer += decoder.decode(value, { stream: true });
                    lines = buffer.split('\n');
                    buffer = (_d = lines.pop()) !== null && _d !== void 0 ? _d : '';
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: '))
                            continue;
                        dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') {
                            res.write('data: [DONE]\n\n');
                            continue;
                        }
                        try {
                            parsedChunk = JSON.parse(dataStr);
                            content = ((_g = (_f = (_e = parsedChunk.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.delta) === null || _g === void 0 ? void 0 : _g.content) || '';
                            if (content) {
                                res.write("data: ".concat(JSON.stringify({ token: content }), "\n\n"));
                            }
                        }
                        catch (_j) {
                            // ignore chunk parse errors
                        }
                    }
                    return [3 /*break*/, 5];
                case 7:
                    res.end();
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _h.sent();
                    console.warn('Chat stream encountered error:', err_1);
                    res.write("data: ".concat(JSON.stringify({
                        token: 'Our AI server is momentarily busy. Please keep windows sealed and wear an N95 mask outdoors.',
                    }), "\n\n"));
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
