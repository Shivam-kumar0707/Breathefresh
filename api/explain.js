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
import { getExplainSystemPrompt } from './_lib/prompts';
import { ExplainOutputSchema } from './_lib/schemas';
var ExplainInputSchema = z.object({
    actionId: z.string(),
    actionTitle: z.string(),
    deltas: z.object({
        deltaEiPct: z.number(),
        deltaCigEq: z.number(),
        deltaCo2eKgWeek: z.number(),
    }),
    memberContext: z.string().optional(),
    language: z.enum(['en', 'hi', 'hinglish']).default('en'),
});
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var bodyData, parsed, input, userContent, groqRes, json, parsedExplain, err_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
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
                    bodyData = _e.sent();
                    _e.label = 2;
                case 2:
                    parsed = ExplainInputSchema.safeParse(bodyData);
                    if (!parsed.success) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid input payload' }));
                        return [2 /*return*/];
                    }
                    input = parsed.data;
                    // Offline / missing key fallback
                    if (!GROQ_CONFIG.apiKey) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            explanation: "Executing \"".concat(input.actionTitle, "\" reduces respiratory fine-particle intake by ").concat(Math.abs(input.deltas.deltaEiPct), "%, equivalent to cutting ").concat(Math.abs(input.deltas.deltaCigEq), " cigarette equivalents daily."),
                            soWhat: 'Direct physics-based reduction in lung exposure for your family.',
                        }));
                        return [2 /*return*/];
                    }
                    userContent = "ACTION: ".concat(input.actionTitle, " (").concat(input.actionId, ")\nENGINE DELTAS:\n- Exposure Index change: ").concat(input.deltas.deltaEiPct, "%\n- Cigarette equivalents saved: ").concat(input.deltas.deltaCigEq, " cigs/day\n- Weekly CO2e saved: ").concat(input.deltas.deltaCo2eKgWeek, " kg CO2e\nCONTEXT: ").concat((_a = input.memberContext) !== null && _a !== void 0 ? _a : 'General family protection');
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, callGroq({
                            model: GROQ_CONFIG.modelFast,
                            messages: [
                                { role: 'system', content: getExplainSystemPrompt(input.language) },
                                { role: 'user', content: userContent },
                            ],
                            json: true,
                            maxTokens: 300,
                            temperature: 0.2,
                        })];
                case 4:
                    groqRes = _e.sent();
                    if (!groqRes.ok) {
                        throw new Error("Groq returned ".concat(groqRes.status));
                    }
                    return [4 /*yield*/, groqRes.json()];
                case 5:
                    json = _e.sent();
                    parsedExplain = ExplainOutputSchema.parse(JSON.parse(((_d = (_c = (_b = json.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) || '{}'));
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(parsedExplain));
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _e.sent();
                    console.warn('Explain failed, returning local fallback explanation:', err_1);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        explanation: "Adopting \"".concat(input.actionTitle, "\" reduces your household daily inhalation dose by ").concat(Math.abs(input.deltas.deltaEiPct), "%."),
                        soWhat: 'Measurable scientific reduction in daily air pollution intake.',
                    }));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
