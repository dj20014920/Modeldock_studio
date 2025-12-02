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