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
import { getChatSystemPrompt, hasRedFlagSymptoms, getDynamicChatFallback } from './_lib/prompts';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';
var ChatInputSchema = z.object({
    messages: z
        .array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(1000),
    }))
        .max(8),
    contextPack: z.string().max(3000),
    language: z.enum(['en', 'hi', 'hinglish']).default('en'),
});
/**
 * Serverless API handler for /api/chat.
 * Provides Server-Sent Events (SSE) streaming conversational answers to user smog questions.
 * Enforces medical safety rules, prompt-injection defenses, strict IP rate limiting,
 * and falls back cleanly to context-aware local generation if the external model is unavailable.
 *
 * @param req - Incoming HTTP request with conversation messages and air context.
 * @param res - Outgoing server response streaming SSE chunks.
 */
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var clientIp, rateCheck, bodyData, parsed, _a, messages, contextPack, language, lastUserMsg, isRedFlag, alertMsg, fallbackMsg, systemPrompt, groqMessages, groqRes, streamBody, reader, decoder, streamBuffer, _b, done, value, lines, _i, lines_1, line, trimmed, jsonStr, parsedChunk, deltaToken, streamBuffer_1, err_1, errorFallback;
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
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
                        return [2 /*return*/];
                    }
                    clientIp = getClientIp(req);
                    rateCheck = checkRateLimit(clientIp, 30, 60000);
                    if (!rateCheck.allowed) {
                        res.statusCode = 429;
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Retry-After', String(rateCheck.resetInSec));
                        res.end(JSON.stringify({
                            error: 'Too many requests. Please wait a moment.',
                            retryAfter: rateCheck.resetInSec,
                        }));
                        return [2 /*return*/];
                    }
                    bodyData = req.body;
                    if (!!bodyData) return [3 /*break*/, 2];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var data = '';
                            var isTooLarge = false;
                            req.on('data', function (chunk) {
                                data += chunk;
                                if (data.length > 15000) {
                                    isTooLarge = true;
                                }
                            });
                            req.on('end', function () {
                                if (isTooLarge) {
                                    resolve({ __payloadTooLarge: true });
                                    return;
                                }
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
                    if (bodyData && typeof bodyData === 'object' && '__payloadTooLarge' in bodyData) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Request payload too large (max 15KB)' }));
                        return [2 /*return*/];
                    }
                    parsed = ChatInputSchema.safeParse(bodyData);
                    if (!parsed.success) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Invalid chat payload', details: parsed.error.format() }));
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
                        fallbackMsg = getDynamicChatFallback(lastUserMsg, contextPack, language);
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
                    _h.trys.push([3, 10, , 11]);
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
                        throw new Error("Groq returned ".concat(groqRes.status));
                    }
                    streamBody = groqRes.body;
                    if (!(typeof (streamBody === null || streamBody === void 0 ? void 0 : streamBody.getReader) === 'function')) return [3 /*break*/, 8];
                    reader = streamBody.getReader();
                    decoder = new TextDecoder('utf-8');
                    streamBuffer = '';
                    _h.label = 5;
                case 5:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, reader.read()];
                case 6:
                    _b = _h.sent(), done = _b.done, value = _b.value;
                    if (done)
                        return [3 /*break*/, 7];
                    streamBuffer += decoder.decode(value, { stream: true });
                    lines = streamBuffer.split('\n');
                    streamBuffer = (_d = lines.pop()) !== null && _d !== void 0 ? _d : '';
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: '))
                            continue;
                        jsonStr = trimmed.slice(6);
                        if (jsonStr === '[DONE]')
                            continue;
                        try {
                            parsedChunk = JSON.parse(jsonStr);
                            deltaToken = (_g = (_f = (_e = parsedChunk.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.delta) === null || _g === void 0 ? void 0 : _g.content;
                            if (deltaToken) {
                                res.write("data: ".concat(JSON.stringify({ token: deltaToken }), "\n\n"));
                            }
                        }
                        catch (_j) {
                            // ignore malformed SSE line
                        }
                    }
                    return [3 /*break*/, 5];
                case 7:
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return [3 /*break*/, 9];
                case 8:
                    if (typeof (streamBody === null || streamBody === void 0 ? void 0 : streamBody.on) === 'function') {
                        streamBuffer_1 = '';
                        streamBody.on('data', function (chunk) {
                            var _a, _b, _c, _d;
                            streamBuffer_1 += chunk.toString('utf-8');
                            var lines = streamBuffer_1.split('\n');
                            streamBuffer_1 = (_a = lines.pop()) !== null && _a !== void 0 ? _a : '';
                            for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
                                var line = lines_2[_i];
                                var trimmed = line.trim();
                                if (!trimmed || !trimmed.startsWith('data: '))
                                    continue;
                                var jsonStr = trimmed.slice(6);
                                if (jsonStr === '[DONE]')
                                    continue;
                                try {
                                    var parsedChunk = JSON.parse(jsonStr);
                                    var deltaToken = (_d = (_c = (_b = parsedChunk.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.delta) === null || _d === void 0 ? void 0 : _d.content;
                                    if (deltaToken) {
                                        res.write("data: ".concat(JSON.stringify({ token: deltaToken }), "\n\n"));
                                    }
                                }
                                catch (_e) {
                                    // ignore malformed SSE line
                                }
                            }
                        });
                        streamBody.on('end', function () {
                            res.write('data: [DONE]\n\n');
                            res.end();
                        });
                        streamBody.on('error', function (err) {
                            console.warn('Groq stream error:', err);
                            res.end();
                        });
                    }
                    else {
                        throw new Error('Unsupported response body stream type from fetch');
                    }
                    _h.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    err_1 = _h.sent();
                    console.warn('Groq chat call failed, streaming fallback:', err_1);
                    errorFallback = getDynamicChatFallback(lastUserMsg, contextPack, language);
                    res.write("data: ".concat(JSON.stringify({ token: errorFallback }), "\n\n"));
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
