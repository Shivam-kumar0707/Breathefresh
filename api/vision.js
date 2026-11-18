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
import { VisionOutputSchema } from './_lib/schemas';
var VisionInputSchema = z.object({
    imageBase64: z.string().max(2000000), // ~1.5MB base64
});
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var bodyData, parsed, fallbackVisionResponse, groqRes, data, validated, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
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
                    bodyData = _d.sent();
                    _d.label = 2;
                case 2:
                    parsed = VisionInputSchema.safeParse(bodyData);
                    if (!parsed.success) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid vision payload' }));
                        return [2 /*return*/];
                    }
                    fallbackVisionResponse = {
                        roomType: 'Living Area / Bedroom',
                        issues: [
                            {
                                type: 'Door & Window Gap Infiltration',
                                severity: 'moderate',
                                note: 'Visible gaps under doors allow ambient outdoor PM2.5 to bypass closed windows.',
                            },
                            {
                                type: 'Purifier Obstruction',
                                severity: 'low',
                                note: 'Purifiers placed tight against a wall or heavy curtains suffer reduced intake airflow.',
                            },
                        ],
                        purifierSpot: 'Place the purifier 1.5–2 feet away from walls, centrally located in the breathing zone.',
                        ventilationNotes: 'Keep windows latched tight during morning inversion hours; open for 15 mins around 2 PM.',
                        suggestedActionIds: ['seal_gaps', 'purifier_bedroom', 'ventilate_best_window_only'],
                    };
                    if (!GROQ_CONFIG.apiKey) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(fallbackVisionResponse));
                        return [2 /*return*/];
                    }
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, callGroq({
                            model: GROQ_CONFIG.modelVision,
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are BreatheFresh Room Scan. Analyze room photos for indoor air pollution factors (open doors, windows facing traffic, gas stoves, air purifier placement, unsealed frames). Return a valid JSON object matching: {"roomType": string, "issues": [{"type": string, "severity": "low"|"moderate"|"high", "note": string}], "purifierSpot": string, "ventilationNotes": string, "suggestedActionIds": string[]}. Choose suggestedActionIds only from: seal_gaps, purifier_bedroom, purifier_living, ventilate_best_window_only, cook_with_hood_or_window, wet_mop, diy_corsi_box.',
                                },
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: 'Analyze this room photo for air quality and purifier placement.' },
                                        {
                                            type: 'image_url',
                                            image_url: {
                                                url: "data:image/jpeg;base64,".concat(parsed.data.imageBase64),
                                            },
                                        },
                                    ],
                                },
                            ],
                            json: true,
                            maxTokens: 800,
                        })];
                case 4:
                    groqRes = _d.sent();
                    if (!groqRes.ok) {
                        throw new Error("Groq vision returned ".concat(groqRes.status));
                    }
                    return [4 /*yield*/, groqRes.json()];
                case 5:
                    data = _d.sent();
                    validated = VisionOutputSchema.parse(JSON.parse(((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '{}'));
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(validated));
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _d.sent();
                    console.warn('Groq vision failed or model unavailable, using fallback diagnosis:', err_1);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(fallbackVisionResponse));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
