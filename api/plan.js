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
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { getPlanSystemPrompt } from './_lib/prompts';
import { PlanOutputSchema } from './_lib/schemas';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';
var PlanInputSchema = z.object({
    language: z.enum(['en', 'hi', 'hinglish']).default('en'),
    city: z.string().min(1).max(100),
    aqiContext: z.object({
        aqi: z.number(),
        pm25: z.number(),
        category: z.string().max(50),
        bestWindow: z.string().max(50),
        worstWindow: z.string().max(50),
    }),
    profileSummary: z.string().min(1).max(500),
    applicableActions: z
        .array(z.object({
        id: z.string().max(60),
        title: z.string().max(120),
        category: z.string().max(50),
        cost: z.string().max(20),
        deltaEiPct: z.number(),
        deltaCigEq: z.number(),
        deltaCo2eKgWeek: z.number(),
    }))
        .max(25),
    grapStage: z.string().max(30).optional(),
});
/**
 * Serverless API handler for /api/plan.
 * Receives validated family air context and engine-computed action impacts, calls Groq (Qwen 3.8 / 27B)
 * with strict temperature and JSON mode, validates the response against PlanOutputSchema,
 * and falls back safely to signal fallback if Groq is unreachable, times out, or fails schema validation.
 *
 * @param req - Incoming HTTP request.
 * @param res - Outgoing server response.
 */
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var clientIp, rateCheck, bodyData, parsedInput, input, systemPrompt, userContent, groqRes, groqJson, rawContent, parsedJson, validatedPlan, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    // CORS headers
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
                    rateCheck = checkRateLimit(clientIp, 20, 60000);
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
                                if (data.length > 10000) {
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
                    bodyData = _d.sent();
                    _d.label = 2;
                case 2:
                    if (bodyData && typeof bodyData === 'object' && '__payloadTooLarge' in bodyData) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Request payload too large (max 10KB)' }));
                        return [2 /*return*/];
                    }
                    parsedInput = PlanInputSchema.safeParse(bodyData);
                    if (!parsedInput.success) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Invalid input payload', details: parsedInput.error.format() }));
                        return [2 /*return*/];
                    }
                    input = parsedInput.data;
                    // If no Groq API Key is configured, trigger client rule-based fallback immediately
                    if (!GROQ_CONFIG.apiKey) {
                        res.statusCode = 503;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ fallback: true, reason: 'GROQ_API_KEY missing' }));
                        return [2 /*return*/];
                    }
                    systemPrompt = getPlanSystemPrompt(input.language);
                    userContent = "CITY: ".concat(input.city, "\nCURRENT AIR: AQI ").concat(input.aqiContext.aqi, " (").concat(input.aqiContext.category, "), PM2.5 ").concat(input.aqiContext.pm25, " \u00B5g/m\u00B3\nCLEANEST WINDOW: ").concat(input.aqiContext.bestWindow, "\nPEAK SMOG: ").concat(input.aqiContext.worstWindow, "\n").concat(input.grapStage ? "GRAP STAGE: ".concat(input.grapStage) : '', "\nFAMILY PROFILE: ").concat(input.profileSummary, "\n\nAPPLICABLE ACTIONS (Choose only from these IDs):\n").concat(JSON.stringify(input.applicableActions, null, 2));
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, callGroq({
                            model: GROQ_CONFIG.modelMain,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userContent },
                            ],
                            json: true,
                            temperature: 0.3,
                            maxTokens: 1200,
                        })];
                case 4:
                    groqRes = _d.sent();
                    if (!groqRes.ok) {
                        throw new Error("Groq returned ".concat(groqRes.status));
                    }
                    return [4 /*yield*/, groqRes.json()];
                case 5:
                    groqJson = _d.sent();
                    rawContent = ((_c = (_b = (_a = groqJson.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '{}';
                    rawContent = rawContent.trim();
                    if (rawContent.startsWith('```json')) {
                        rawContent = rawContent.slice(7);
                    }
                    else if (rawContent.startsWith('```')) {
                        rawContent = rawContent.slice(3);
                    }
                    if (rawContent.endsWith('```')) {
                        rawContent = rawContent.slice(0, -3);
                    }
                    rawContent = rawContent.trim();
                    parsedJson = JSON.parse(rawContent);
                    validatedPlan = PlanOutputSchema.parse(parsedJson);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(validatedPlan));
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _d.sent();
                    console.warn('Groq /api/plan call failed, signaling fallback:', err_1);
                    res.statusCode = 503;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ fallback: true, error: err_1.message }));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
