핵심: 각 플랫폼의 BYOK(자체 키) 호출에서 공통 제어(temperature, top_p 등)와 모델별 고유 옵션(예: reasoning/thinking 토글, 구조화 출력, 서비스 티어)을 정리해 드립니다. 아래 항목만 구현해도 대부분의 모델을 안정적으로 호출·구분·튜닝할 수 있습니다.[1][2][3]

## 작업 개요
- 목표: 주요 모델 제공사(Alibaba/Qwen, DeepSeek, Google Gemini, Anthropic Claude, Moonshot Kimi, OpenAI, Mistral, xAI/Grok, OpenRouter)의 문서에서 실제 API 파라미터와 “생각/추론(thinking/reasoning)” 지원 여부·구분 방법을 확인해 BYOK 호출 기준 사양을 도출.[2][3][4][1]
- 범위: 생성 제어(temperature/top_p 등), 토큰 상한, 구조화 출력(JSON/스키마), 도구 호출, 스트리밍, 모델·엔드포인트 호환성, 고유 제약(예: 일부 reasoning 모델에서 stop 미지원).[3][1][2]

## OpenAI · Google · Anthropic
- 개요: OpenAI는 Chat Completions/Responses에 폭넓은 샘플링·구조화·도구 옵션을 제공하고, reasoning 모델에서 별도 제약이 있습니다; Gemini는 GenerationConfig와 “사고(Thinking) 예산”으로 제어하며, Claude는 Messages API에 명시적 Thinking 구성을 노출합니다.[1][2][3]

- OpenAI(https://api.openai.com)
  - 주요 파라미터: temperature, top_p, max_completion_tokens(신규), frequency_penalty, presence_penalty, logit_bias, logprobs, response_format(JSON 스키마 강제), tools/tool_choice, parallel_tool_calls, stream, service_tier, reasoning_effort, web_search_options 등.[1]
  - 주의: 최신 reasoning(o3/o4-mini 등)에서 stop 미지원, max_tokens는 폐기·대신 max_completion_tokens 사용, reasoning_effort는 모델별 허용값 다름.[1]

- Google Gemini(https://generativelanguage.googleapis.com 또는 SDK)
  - GenerationConfig로 temperature, topP, topK, maxOutputTokens, stopSequences 등 설정; 2.5 Flash/Pro는 Thinking 기본 활성이며 예산을 0으로 내려 비활성화 가능.[3]
  - 가이드 권고: Gemini 3 계열은 temperature 1.0 유지 권장(낮추면 루프·성능 저하 가능성), 구조화 출력(JSON/스키마)과 함수 호출, 긴 컨텍스트·스트리밍 지원.[3]

- Anthropic Claude(https://api.anthropic.com)
  - Messages API에 ThinkingConfigEnabled/Disabled가 있으며 budget_tokens로 사고 토큰 상한을 제어; Thinking/RedactedThinking 블록과 WebSearch/ToolUse 블록 타입이 노출됨.[2]
  - 메시지 중심 스키마와 토큰 카운트, 배치·스토리지 등 관리 기능 제공(세부 생성 파라미터는 Messages Create 문서에서 확장).[2]

## xAI · Mistral · DeepSeek
- 개요: xAI는 OpenAI 호환 REST와 Anthropic 호환 Messages를 함께 제공하며 reasoning 토큰 사용량을 표준화합니다; Mistral은 Chat Completions와 Sampling·Reasoning 문서를 구분해 노출합니다; DeepSeek은 OpenAI 호환 API와 “thinking/non-thinking” 모델 쌍으로 구분합니다.[4]

- xAI/Grok(https://api.x.ai)
  - 엔드포인트: /v1/chat/completions, /v1/responses(상태·컨텍스트 유지형), /v1/messages(Anthropic 호환), 이미지 생성 등; temperature/top_p/stream/tool_choice/tools 등 OpenAI 유사 필드를 수용. 
  - 모델 조회·가격·지문·토큰화 API 제공, usage에 reasoning_tokens 필드 포함(Reasoning 모델 지원 신호). 

- Mistral(https://api.mistral.ai)
  - 능력 문서에 Chat Completions와 Sampling(무작위성 제어), Reasoning 섹션이 분리되어 있음(세부 샘플링 파라미터는 Sampling 하위 문서 참고).[4]
  - 모델군·에이전트·함수 호출·구조화 출력 등 가이드가 제공되며, 엔드포인트/파라미터는 Chat Completions/Usage 문서 흐름을 따름.[4]

- DeepSeek(https://api.deepseek.com)
  - OpenAI 호환 베이스 URL과 키로 호출 가능; deepseek-chat=비사고(non-thinking), deepseek-reasoner=사고(thinking)로 명시 구분. 
  - 문서에 Temperature 파라미터·Thinking Mode·JSON 모드·Tool Calls·Anthropic API 호환 가이드와 변경 이력이 제공됨. 

## Moonshot · OpenRouter · Alibaba
- 개요: Moonshot(Kimi)은 Chat/Tool Use/Partial/JSON 모드와 “kimi-k2-thinking” 모델을 제공하며, OpenAI에서의 마이그레이션 가이드가 있습니다; OpenRouter는 멀티모달 입력 규약과 이미지 인코딩 방식을 표준화합니다; Alibaba Cloud 문서는 Qwen 기반의 AI 문서·API/SDK 허브를 제공합니다. 

- Moonshot Kimi(https://platform.moonshot.cn)
  - API: Chat, Tool Use, Partial Mode, JSON Mode, Vision, 스트리밍, 토큰 견적/잔액 API 등; “kimi-k2-thinking” 모델로 다단계 도구 호출·사고 지원. 
  - 가이드: OpenAI에서의 이전, Thinking 베스트 프랙티스, 에이전트/검색 도구 통합 가이드 제공. 

- OpenRouter(https://openrouter.ai)
  - 이미지 입력: messages 배열에 text 후 image_url 권장, URL 또는 base64 데이터 모두 지원; 형식 image/png/jpeg/webp/gif, 여러 이미지 전송 가능(모델/제공자별 한도 상이). 
  - 멀티모달 라우팅·프로바이더 선택 등은 OpenRouter 가이드에 따름(모델·제공자별 차등). 

- Alibaba Cloud(Qwen/Model Studio)
  - 문서 허브에서 AI & ML, API/SDK, 코드 예시, CLI/Cloud Shell/ROS 등 개발 리소스를 제공(모델·프로바이더 파라미터 열거 UI 포함). 
  - 실제 추론 API는 Qwen/Model Studio(또는 DashScope) 제품 문서 경로에서 모델별 파라미터 확인 필요. 

## 구현 체크리스트
- 모델 구분 규칙
  - 이름 기반: deepseek-reasoner(사고), kimi-k2-thinking(사고), OpenAI reasoning_effort 노출 모델(o-계열 등), xAI usage.reasoning_tokens 증가.[1]
  - 파라미터 기반: OpenAI reasoning_effort 존재, Anthropic ThinkingConfigEnabled/budget_tokens, Gemini Thinking 예산 설정 가능.[2][3][1]
- 공통 샘플링·출력
  - 샘플링: temperature/top_p는 OpenAI·xAI·Gemini에서 명시적 지원(둘 중 하나만 조절 권장은 OpenAI 가이드).[3][1]
  - 출력: JSON/스키마 강제는 OpenAI response_format(json_schema), Gemini 구조화 출력 가이드, xAI Structured Outputs 가이드 경로 제공.[3][1]
- 제약·주의
  - OpenAI 최신 reasoning에서 stop 미지원, max_tokens 폐기 → max_completion_tokens 사용.[1]
  - Gemini 3에서 temperature 과도한 하향 조정 시 루프/성능 저하 가능성.[3]
  - Mistral 세부 샘플링·Reasoning 파라미터는 전용 하위 문서에서 교차 확인 후 반영.[4]

[1](https://www.alibabacloud.com/help/en/)
[2](https://www.deepseek.com)
[3](https://ai.google.dev/gemini-api/docs?hl=ko)
[4](https://www.alibabacloud.com/help/en/)
[5](https://www.anthropic.com)


## DeepSeek
- DeepSeek은 Anthropic API 포맷을 공식 지원하며, Anthropic SDK의 BASE_URL을 DeepSeek 호스트로 교체해 BYOK 방식으로 호출할 수 있습니다.[1]
- 이 호환 경로에서 messages, system, max_tokens, stop_sequences, stream, temperature(0.0~2.0), top_p, tools, tool_choice(none/auto/any/tool) 등이 작동하며, thinking 필드도 지원하되 budget_tokens는 무시됩니다.[1]
- DeepSeek은 온도 기본값과 용도별 권장값을 별도 페이지로 제공하며, 예를 들어 코딩/수학 0.0, 일반 대화 1.3, 번역 1.3, 창작/시 1.5와 같은 가이드가 명시되어 있습니다.[2]

## Anthropic Claude
- Claude의 Messages API는 model, messages(역할/콘텐츠), system, max_tokens, stop_sequences, temperature, top_p, top_k, tools/tool_choice 등을 핵심 인자로 사용합니다.[3][4]
- DeepSeek의 Anthropic 호환 엔드포인트는 Claude의 thinking 관련 필드 및 type="thinking" 콘텐츠도 지원한다고 명시되어 있어 Claude 호환 호출에서 해당 기능을 그대로 사용할 수 있습니다.[1]

## Moonshot Kimi
- Moonshot(Kimi) 플랫폼은 OpenAI 호환 Chat Completions 스타일의 HTTP API를 제공하며 기본적으로 model과 messages가 필수입니다.[5]
- 문서 기준으로 temperature, top_p, max_tokens, stop, stream 등 표준 샘플링/제어 인자를 사용할 수 있고, OpenAI SDK와의 호환성을 명확히 안내합니다.[5]

[1](https://api-docs.deepseek.com/guides/anthropic_api)
[2](https://api-docs.deepseek.com/quick_start/parameter_settings)
[3](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
[4](https://docs.claude.com/en/api/messages)
[5](https://platform.moonshot.ai/docs/api/chat)
[6](https://www.alibabacloud.com/help/en/)
[7](https://www.deepseek.com/)
[8](https://ai.google.dev/gemini-api/docs?hl=ko)
[9](https://www.anthropic.com/)
[10](https://www.alibabacloud.com/help/en/)
[11](https://www.deepseek.com)
[12](https://ai.google.dev/gemini-api/docs?hl=ko)
[13](https://www.anthropic.com)
[14](https://www.moonshot.ai/)
[15](https://aacrjournals.org/clincancerres/article/31/13_Supplement/B018/763305/Abstract-B018-Practical-benchmarking-of-large)
[16](http://arxiv.org/pdf/2502.08515.pdf)
[17](https://arxiv.org/pdf/2306.01286.pdf)
[18](https://arxiv.org/pdf/2412.19437.pdf)
[19](https://arxiv.org/pdf/2405.04434.pdf)
[20](https://arxiv.org/pdf/2411.09661.pdf)
[21](https://arxiv.org/pdf/2501.18576.pdf)
[22](https://arxiv.org/html/2502.05234v1)
[23](https://arxiv.org/pdf/2404.04575.pdf)
[24](https://ai.google.dev/gemini-api/docs/api-key?hl=ko)
[25](https://www.alibabacloud.com/help/en/pai/use-cases/deepseek-model-development-application-guide)
[26](https://www.alibabacloud.com/blog/alibaba-cloud-native-api-gateway-helps-industries-connect-to-deepseek-safely-and-reliably_601986)
[27](https://huggingface.co/datasets/modelbiome/ai_ecosystem_withmodelcards/viewer/default/train?p=2)
[28](https://docs.newapi.pro/en/api/anthropic-chat/)
[29](https://docs.aimlapi.com/api-references/text-models-llm/moonshot/kimi-k2-preview)
[30](https://www.alibabacloud.com/solution/tech-solution/deepseek-r1-for-platforms)
[31](https://docs.aws.amazon.com/ko_kr/bedrock/latest/userguide/model-parameters-deepseek.html)
[32](https://www.datacamp.com/tutorial/kimi-k2)
[33](https://www.alibabacloud.com/blog/602057)
[34](https://muxup.com/2025q2/recommended-llm-parameter-quick-reference)
[35](https://docs.aws.amazon.com/ko_kr/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
[36](https://kimi-ai.chat/docs/api/)
[37](https://www.youtube.com/watch?v=q31xn_E7MmQ)
[38](https://www.reddit.com/r/DeepSeek/comments/1j7uwqb/deepseek_api_optimal_parameters_config/)
[39](https://moonshotai.github.io/Kimi-K2/)
[40](https://arxiv.org/abs/2401.11504)
[41](https://arxiv.org/abs/2410.21357)
[42](https://arxiv.org/abs/2407.06135)
[43](https://arxiv.org/abs/2408.13586)
[44](https://services.igi-global.com/resolvedoi/resolve.aspx?doi=10.4018/IJSWIS.339187)
[45](https://arxiv.org/abs/2402.04609)
[46](https://arxiv.org/abs/2412.04318)
[47](https://www.semanticscholar.org/paper/3ed8f36ecd740e6a177189e4f41d3c8dd23f7cd2)
[48](https://ieeexplore.ieee.org/document/10651167/)
[49](https://direct.mit.edu/tacl/article/doi/10.1162/TACL.a.48/133800/Frame-Representation-Hypothesis-Multi-Token-LLM)
[50](https://arxiv.org/html/2503.07512v1)
[51](https://aclanthology.org/2022.findings-emnlp.136.pdf)
[52](http://arxiv.org/pdf/2304.09516.pdf)
[53](https://arxiv.org/html/2412.17225v1)
[54](https://aclanthology.org/2023.inlg-main.29.pdf)
[55](https://arxiv.org/pdf/2310.00152.pdf)
[56](https://arxiv.org/pdf/2302.04166.pdf)
[57](https://arxiv.org/pdf/1901.09501.pdf)
[58](https://github.com/cnblogs/dashscope-sdk)
[59](https://docs.spring.io/spring-ai/docs/1.0.0-M6/api/org/springframework/ai/moonshot/api/MoonshotApi.html)
[60](https://doc.agentscope.io/_modules/agentscope/model/_dashscope_model.html)
[61](https://portkey.ai/docs/integrations/llms/moonshot)
[62](https://pkg.go.dev/github.com/kubeagi/arcadia/pkg/llms/dashscope)
[63](https://docs.litellm.ai/docs/providers/moonshot)
[64](https://developers.llamaindex.ai/python/framework-api-reference/llms/dashscope/)
[65](https://platform.openai.com/docs/api-reference/chat/create)
[66](https://raw.githubusercontent.com/modelcontextprotocol/servers/refs/heads/main/README.md)
[67](https://www.alibabacloud.com/help/en/model-studio/qwen-tts-api)

요청하신 각 사이트의 공식 문서를 실제로 확인해 BYOK 호출 시 쓸 수 있는 핵심 파라미터, 고유 기능(예: thinking), 모델 식별 방법을 회사별로 정리했습니다. 아래 표와 섹션을 그대로 구현 기준으로 참고하세요. 

## 핵심 파라미터 요약
| 제공사/플랫폼 | 샘플링(temperature/top_p/top_k) | 최대 토큰 | 정지 토큰 | 도구 호출(tools/tool_choice) | Thinking/Reasoning |
|---|---|---|---|---|---|
| DeepSeek | temperature, top_p 지원(Anthropic 호환). 온도 가이드 별도 제공(코딩/수학 0.0, 일반 1.3 등) [1][2] | max_tokens 지원 [1] | stop_sequences 지원 [1] | tools, tool_choice(none/auto/any/tool) 지원 [1] | v3.2-exp·v3.1은 enable_thinking로 on/off, r1은 항상 thinking. reasoning_content 스트리밍 제공 [3] |
| Anthropic(Claude) | temperature, top_p, top_k 지원 [4][5] | max_tokens 지원 [4] | stop_sequences 지원 [4] | tools, tool_choice 지원 [4] | — |
| Google Gemini | temperature, topP, topK 지원(GenerationConfig) [6] | maxOutputTokens(GenerationConfig) [6] | stopSequences(GenerationConfig) [6] | 함수 호출(Function calling) 지원 [6] | — |
| Moonshot(Kimi) | temperature, top_p 지원(OpenAI 호환 Chat Completions) [7][8] | max_tokens 지원 [8] | stop 지원 [7] | OpenAI 호환 tools 패턴 사용 가능(문서상 OpenAI SDK 호환 안내) [7] | — |
| Alibaba Cloud(Model Studio/DashScope, Qwen) | temperature(0≤<2), top_p(0–1) 지원 및 사용 가이드 제공 [9] | 모델별 limits(문서·예제 기반) [10] | stop(프로토콜에 따라 설정) [10] | OpenAI 호환/ DashScope 프로토콜 모두 제공 [10] | Qwen 계열에 “깊은 사고(Deep Thinking)” 제공(전용 호출 가이드) [11] |

## DeepSeek 세부사항
- Anthropic API 포맷 호환: messages, system, max_tokens, stop_sequences, stream, temperature, top_p, tools, tool_choice 등 필드가 동작하며 budget_tokens는 무시됩니다. 이 경로를 통해 BYOK 형태로 교체 호출이 가능합니다.[1]
- Thinking/Reasoning: v3.2-exp·v3.1은 enable_thinking 파라미터로 사고 모드 on/off, r1 계열은 항상 사고 모드이며 reasoning_content가 스트리밍으로 분리되어 전송됩니다(일부 모델은 샘플링 파라미터 비활성).[3]
- 온도 설정 가이드: 공식 가이드에서 작업 유형별 권장값을 제시(예: 코딩/수학 0.0, 일반 대화·번역 1.3, 창작 1.5 등)하여 서비스 성격에 따른 빠른 튜닝이 가능합니다.[2]

## Claude(Anthropic) 세부사항
- 권장 최신 인터페이스는 Messages API이며, model, messages, system, max_tokens, stop_sequences, temperature, top_p, top_k, tools/tool_choice 등의 파라미터를 사용합니다.[5][4]
- 멀티턴 및 도구 호출을 표준화된 스키마로 제공하므로, 동일 포맷을 지원하는 프록시/게이트웨이로 BYOK 연결 시 파라미터 호환성이 높습니다.[4]

## Google Gemini 세부사항
- generateContent 기반으로 model, contents를 핵심으로 하고 GenerationConfig에서 temperature, topP, topK, maxOutputTokens, stopSequences를 제어합니다.[6]
- 구조화 출력(JSON), 함수 호출(Function calling), 시스템 프롬프트(system instruction), 안전 설정 등 에이전트 워크플로우에 필요한 옵션을 네이티브로 제공합니다.[6]

## Moonshot(Kimi)·Alibaba( DashScope/Qwen) 세부사항
- Moonshot(Kimi): OpenAI 호환 Chat Completions를 안내하며, model·messages 필수, temperature/top_p/max_tokens/stop/stream 등 표준 인자를 그대로 사용합니다(“OpenAI SDK 호환” 명시).[7][8]
- Alibaba Model Studio(Qwen/DashScope): OpenAI 호환 엔드포인트와 DashScope 네이티브 프로토콜을 모두 제공하고, 지역별 base_url·경로를 문서에 명시합니다(베이징/싱가포르/금융클라우드). 또한 텍스트 생성 문서에서 temperature(0≤<2)/top_p(0–1) 활용 가이드, 장면별 추천값 등 운영 가이드를 제공합니다. Qwen 계열은 “깊은 사고(Deep Thinking)” 호출 가이드가 따로 있어 사고 모드 기반 스트리밍 처리 패턴을 제공합니다.[9][10][11]

원하시면 다음 단계로 각 플랫폼별 “허용 범위/기본값/제약”을 코드 스니펫과 함께 리팩터링해 드리고, 특정 모델만 지원하는 전용 파라미터(예: DeepSeek enable_thinking, Qwen Deep Thinking) 및 모델 식별 로직(모델명 패턴/엔드포인트/리전)을 SDK별 어댑터 코드 형태로 정리해 드리겠습니다.  
- DeepSeek 문서: Anthropic 호환 가이드, 온도 가이드[1][2]
- Claude 문서: Messages API 레퍼런스, Bedrock 파라미터 문서[5][4]
- Gemini 문서: Gemini API 개요/GenerationConfig[6]
- Moonshot 문서: 플랫폼 API 안내, Kimi API 예시[8][7]
- Alibaba Cloud 문서: Qwen API 레퍼런스/엔드포인트, 텍스트 생성 파라미터 가이드, Deep Thinking[10][11][9]

[1](https://api-docs.deepseek.com/guides/anthropic_api)
[2](https://api-docs.deepseek.com/quick_start/parameter_settings)
[3](https://help.aliyun.com/zh/model-studio/deepseek-api)
[4](https://docs.claude.com/en/api/messages)
[5](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
[6](https://ai.google.dev/gemini-api/docs?hl=ko)
[7](https://platform.moonshot.ai/docs/api/chat)
[8](https://kimi-ai.chat/docs/api/)
[9](https://help.aliyun.com/zh/model-studio/text-generation)
[10](https://help.aliyun.com/zh/model-studio/qwen-api-reference)
[11](https://help.aliyun.com/zh/model-studio/deep-thinking)
[12](https://www.moonshot.ai/)
[13](https://arxiv.org/pdf/2401.01827.pdf)
[14](https://arxiv.org/pdf/2407.00079.pdf)
[15](https://arxiv.org/pdf/2307.16789.pdf)
[16](http://arxiv.org/pdf/2407.12016.pdf)
[17](https://aclanthology.org/2023.emnlp-industry.74.pdf)
[18](http://arxiv.org/pdf/2502.13475.pdf)
[19](http://arxiv.org/pdf/2307.07924.pdf)
[20](http://arxiv.org/pdf/2403.16637.pdf)
[21](https://doc-en.302.ai/207705118e0)
[22](https://docs.spring.io/spring-ai/docs/1.0.0-M6/api/org/springframework/ai/moonshot/api/MoonshotApi.ChatCompletionChunk.html)
[23](https://docs.aimlapi.com/api-references/text-models-llm/moonshot/kimi-k2-preview)
[24](https://portkey.ai/docs/integrations/llms/moonshot)
[25](https://huggingface.co/blog/francesca-petracci/kimi-k2-api)
[26](https://www.chatbase.co/blog/claude-api)
[27](https://docs.litellm.ai/docs/providers/moonshot)
[28](https://platform.claude.com/docs/en/api/go/messages/create)
[29](https://mastra.ai/models/providers/moonshotai)
[30](https://openrouter.ai/moonshotai/kimi-k2-thinking)
[31](https://docs.apimart.ai/en/api-reference/texts/general/claude-messages)
[32](https://docs.typingmind.com/manage-and-connect-ai-models/moonshot-ai-(kimi-k2))
[33](https://huggingface.co/moonshotai/Kimi-K2-Instruct)
[34](https://apidog.com/kr/blog/kimi-k2-thinking-api-kr/)
[35](https://moonshotai.github.io/Kimi-K2/)
[36](https://platform.claude.com/docs/en/build-with-claude/working-with-messages)
[37](https://platform.moonshot.ai/docs/introduction)
[38](https://ieeexplore.ieee.org/document/11161652/)
[39](https://ieeexplore.ieee.org/document/9776045/)
[40](https://pubs.aip.org/pop/article/30/4/042101/2882935/3D-simulation-of-lower-hybrid-drift-waves-in)
[41](https://www.ijournalse.org/index.php/ESJ/article/view/2354)
[42](https://www.mdpi.com/2079-6382/12/11/1610)
[43](https://link.springer.com/10.1007/s10973-021-10561-4)
[44](https://link.springer.com/10.1007/s11277-023-10829-y)
[45](https://ieeexplore.ieee.org/document/10843266/)
[46](https://www.mdpi.com/2076-3417/15/15/8670)
[47](https://ieeexplore.ieee.org/document/11161815/)
[48](https://arxiv.org/html/2412.17225v1)
[49](https://www.aclweb.org/anthology/2020.emnlp-main.443.pdf)
[50](https://arxiv.org/html/2409.17524)
[51](https://arxiv.org/html/2501.05892v1)
[52](http://arxiv.org/pdf/2503.02911.pdf)
[53](https://arxiv.org/pdf/2211.01324.pdf)
[54](https://arxiv.org/pdf/2303.00908.pdf)
[55](https://arxiv.org/pdf/2310.00152.pdf)
[56](https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen)
[57](https://help.aliyun.com/zh/model-studio/error-code)
[58](https://help.aliyun.com/zh/model-studio/videos/dolly-api)
[59](https://www.reddit.com/r/Bard/comments/1cutvq9/is_there_a_way_to_set_the_temperature_higher_than/)
[60](https://www.alibabacloud.com/help/en/model-studio/text-to-image-v2-api-reference)
[61](https://help.aliyun.com/zh/model-studio/qwen-function-calling)
[62](https://dashscope.aliyun.com)
[63](https://help.aliyun.com/zh/model-studio/kimi-api)
[64](https://help.aliyun.com/zh/model-studio/baichuan-api)
[65](https://help.aliyun.com/zh/model-studio/dashscope-api-reference)
[66](https://help.aliyun.com/zh/model-studio/vision)
[67](https://help.aliyun.com/zh/model-studio/qwen-mt-api)
[68](https://www.alibabacloud.com/help/zh/model-studio/application-calling-guide)
[69](https://help.aliyun.com/zh/model-studio/qwen-vl-ocr-api-reference)
[70](https://help.aliyun.com/zh/dashscope/api-details-1)
[71](https://help.aliyun.com/zh/model-studio/model-calling-in-sub-workspace)
[72](https://blog.csdn.net/weixin_56049761/article/details/134905344)

요청하신 모든 플랫폼의 허용 범위, 기본값, 제약과 가이드를 공식 문서에서 확인해 실사용 관점으로 정리했습니다. 또한 특정 모델 전용 파라미터와 모델 식별 로직을 SDK 어댑터 스켈레톤 코드 형태로 포함했습니다. 

## Anthropic + DeepSeek
- 공통 파라미터: model, messages, system, max_tokens, stop_sequences, temperature, top_p, top_k, tools/tool_choice 등 사용. Claude Messages API에서 temperature·top_p·top_k·stop_sequences·max_tokens 지원이 명시되어 있습니다.[1][2]
- DeepSeek의 Anthropic 호환: BASE_URL을 https://api.deepseek.com/anthropic 로 설정하면 Anthropic SDK/포맷으로 DeepSeek을 호출 가능. temperature(0.0~2.0)·top_p·max_tokens·stop_sequences·stream·system·tools·tool_choice 등 지원, top_k는 무시, thinking은 지원하되 budget_tokens는 무시, 일부 콘텐츠 타입(이미지/문서 등) 비지원이 명시되어 있습니다.[3]
- DeepSeek 온도 가이드/기본값: 기본 temperature=1.0, 권장값 예시는 코딩/수학 0.0, 일반 대화/번역 1.3, 창작 1.5로 안내되어 있습니다.[4]
- 사고 모드 모델 구분: DeepSeek v3.2-exp·v3.1은 혼합(토글형) 사고 모드, DeepSeek-R1 계열은 항상 사고 모드(전용)로 정리되어 있으며 reasoning_content와 content가 분리 스트리밍됨이 안내되어 있습니다.[5]

## Google Gemini
- 핵심 파라미터(GenerationConfig): temperature, topP, topK, maxOutputTokens, stopSequences를 사용하며 generateContent 호출에서 model과 contents를 기본으로 합니다.[6]
- 기능 가이드: 구조화 출력(JSON), 함수 호출, 긴 컨텍스트, 문서 이해, 도구 연결 등 에이전트 워크플로우 구성 기능이 네이티브로 제공됩니다.[6]

## Moonshot(Kimi)
- API 스타일: OpenAI 호환 Chat Completions 스타일을 제공하며 model·messages 필수, temperature·top_p·max_tokens·stop·stream 등 표준 인자 사용을 안내합니다.[7]
- 사고 모드 모델: Kimi K2 Thinking은 “항상 사고” 모델로 분류되며 reasoning_content가 분리되어 스트리밍되는 패턴이 가이드에 포함됩니다.[5]

## Alibaba Cloud Model Studio(DashScope/Qwen)
- 엔드포인트/리전: OpenAI 호환 모드 base_url은 베이징 https://dashscope.aliyuncs.com/compatible-mode/v1, 싱가포르 https://dashscope-intl.aliyuncs.com/compatible-mode/v1, 금융云 https://dashscope-finance.aliyuncs.com/compatible-mode/v1 를 사용합니다.[8]
- DashScope 네이티브: 텍스트 생성(LLM) 엔드포인트는 베이징 https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation, 싱가포르/금융云도 별도 URL이 명시되어 있습니다.[8]
- 파라미터 가이드: 텍스트 생성 개요에서 temperature(0≤<2)·top_p(0–1) 등 사용 가이드가 제시됩니다.[9]
- Deep Thinking: enable_thinking 토글(혼합형)과 thinking_budget(최대 추론 토큰 제한)을 지원. reasoning_content와 content가 분리되어 스트리밍되며, Qwen/DeepSeek/GLM/Kimi 등 모델별 “혼합/항상 사고” 구분과 지원 모델 목록이 문서에 명시되어 있습니다.[5]

## SDK 어댑터 스켈레톤
- DeepSeek(Anthropic 호환, Python): Anthropic SDK + BASE_URL로 DeepSeek 연결. Anthropic 포맷의 temperature[0.0~2.0], top_p, max_tokens, stop_sequences, tools/tool_choice, thinking 등을 지원합니다.[3]
  ```python
  # DeepSeek via Anthropic SDK
  # 문서: https://api.deepseek.com/anthropic (Anthropic 호환) [web:62]
  import anthropic, os
  os.environ["ANTHROPIC_BASE_URL"] = "https://api.deepseek.com/anthropic"
  os.environ["ANTHROPIC_API_KEY"] = "<DEEPSEEK_API_KEY>"
  client = anthropic.Anthropic()
  msg = client.messages.create(
      model="deepseek-chat",               # 미지원 모델명 전달 시 deepseek-chat으로 맵핑 [web:62]
      max_tokens=1024,
      temperature=1.0,
      top_p=0.9,
      stop_sequences=["</s>"],
      system="You are a helpful assistant.",
      messages=[{"role":"user","content":[{"type":"text","text":"Hello"}]}],
      thinking={"type":"enabled"}          # budget_tokens는 무시됨 [web:62]
  )
  ```
- Claude(Anthropic, Python): Messages API 표준 인자 사용(temperature/top_p/top_k/max_tokens/stop_sequences/tools/tool_choice).[2][1]
  ```python
  import anthropic, os
  client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
  msg = client.messages.create(
      model="<claude-model-id>",
      max_tokens=1024,
      temperature=0.7, top_p=0.9, top_k=50,  # 지원됨 [web:36][web:28]
      stop_sequences=["</s>"],
      system="You are Claude.",
      tools=[{"name":"lookup","input_schema":{"type":"object","properties":{"q":{"type":"string"}}}}],
      tool_choice="auto",
      messages=[{"role":"user","content":[{"type":"text","text":"Hello"}]}],
  )
  ```
- Gemini(Python): GenerationConfig로 temperature/topP/topK/maxOutputTokens/stopSequences 설정.[6]
  ```python
  # Gemini API 문서의 예시 형식 [file:3]
  from google import genai
  client = genai.Client()
  resp = client.models.generate_content(
      model="gemini-2.5-flash",            # 모델 목록 및 기능은 문서 참조 [file:3]
      contents="Hello",
      config={
        "temperature": 0.8, "topP": 0.9, "topK": 40,
        "maxOutputTokens": 1024, "stopSequences": ["</s>"]
      }
  )
  ```
- Moonshot(Kimi, Node/JS OpenAI 호환): Chat Completions 스타일 인자 사용(temperature/top_p/max_tokens/stop/stream).[7]
  ```javascript
  // Moonshot OpenAI 호환 [web:67]
  import OpenAI from "openai";
  const client = new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY,
    baseURL: "https://platform.moonshot.ai/openai/v1" // 실제 호스트는 플랫폼 문서에 따름 [web:67]
  });
  const res = await client.chat.completions.create({
    model: "kimi-k2", messages: [{role:"user", content:"Hello"}],
    temperature: 0.7, top_p: 0.9, max_tokens: 1024, stop: ["</s>"], stream: false
  });
  ```
- Alibaba Model Studio/Qwen  
  - OpenAI 호환(Python): 리전에 따라 base_url을 베이징/싱가포르/금융云로 설정, enable_thinking과 thinking_budget은 extra_body로 전달(혼합형), reasoning_content 분리 스트리밍.[8][5]
  ```python
  from openai import OpenAI
  client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"  # 베이징; 싱가포르는 intl [web:107]
  )
  completion = client.chat.completions.create(
    model="qwen-plus",
    messages=[{"role":"user","content":"Hello"}],
    temperature=0.8, top_p=0.9, max_tokens=1024, stream=True,
    extra_body={"enable_thinking": True, "thinking_budget": 64}    # 혼합형 사고 + 추론 토큰 제한 [web:121]
  )
  ```
  - DashScope 네이티브(Python): text-generation/generation 엔드포인트, enable_thinking·thinking_budget·incremental_output·result_format 등 사용.[5][8]
  ```python
  from dashscope import Generation
  completion = Generation.call(
    model="qwen-plus",
    messages=[{"role":"user","content":"Hello"}],
    result_format="message", stream=True, incremental_output=True,
    enable_thinking=True, thinking_budget=64                       # 사고/추론 토큰 제어 [web:121]
  )
  ```

필요 시 위 어댑터 스켈레톤을 기반으로 공통 어댑터 인터페이스에 매핑해 드리며, 플랫폼별 제약(예: DeepSeek Anthropic 모드에서 이미지/문서 콘텐츠 미지원, top_k 무시, Kimi/DeepSeek/Qwen의 사고 모드 스트리밍 전제, 지역별 base_url 차이)을 런타임에서 모델명 패턴·엔드포인트·리전으로 감지해 분기하는 로직까지 더 촘촘히 구성해 드릴 수 있습니다.[1][3][7][6][8][5]

[1](https://docs.claude.com/en/api/messages)
[2](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
[3](https://api-docs.deepseek.com/guides/anthropic_api)
[4](https://api-docs.deepseek.com/quick_start/parameter_settings)
[5](https://help.aliyun.com/zh/model-studio/deep-thinking)
[6](https://ai.google.dev/gemini-api/docs?hl=ko)
[7](https://platform.moonshot.ai/docs/api/chat)
[8](https://help.aliyun.com/zh/model-studio/qwen-api-reference)
[9](https://help.aliyun.com/zh/model-studio/text-generation)
[10](https://www.moonshot.ai/)