# Brain Flow Prompts - All Languages Implementation Guide

## Overview
This document contains optimized Main Brain prompts for all 14 supported languages, designed to maximize LLM performance by considering cultural context and linguistic characteristics.

## Implementation Status
- ✅ Korean (ko) - Completed
- ✅ English (en) - Completed
- ✅ Japanese (ja) - Completed
- ✅ Simplified Chinese (zh-CN) - Completed
- ✅ Traditional Chinese (zh-TW) - Completed
- ✅ Spanish (es) - Completed
- ✅ French (fr) - Completed
- ✅ German (de) - Completed
- ✅ Russian (ru) - Completed
- ✅ Portuguese (pt) - Completed
- ✅ Italian (it) - Completed
- ✅ Indonesian (id) - Completed
- ✅ Thai (th) - Completed
- ✅ Vietnamese (vi) - Completed

**All 14 languages successfully implemented! (2025-11-22)**

## Language-Specific Optimization Strategies

### Japanese (ja)
- **Characteristics**: Polite + Imperative combined, concise and accurate
- **Optimization**: Uses ですます調 (polite form) with clear commands
- **Cultural Context**: Precision and respect are key

### Simplified Chinese (zh-CN)
- **Characteristics**: Concise, direct, verb-centered
- **Optimization**: Minimal words, maximum clarity
- **Cultural Context**: Efficiency and directness valued

### Traditional Chinese (zh-TW)
- **Characteristics**: Similar to zh-CN but more polite
- **Optimization**: Slightly more formal expressions
- **Cultural Context**: Respect and tradition

### Spanish (es)
- **Characteristics**: Imperative + polite form combination
- **Optimization**: Clear commands with courteous tone
- **Cultural Context**: Warmth and clarity

### French (fr)
- **Characteristics**: Formal and elegant expressions
- **Optimization**: Structured, sophisticated language
- **Cultural Context**: Precision and elegance

### German (de)
- **Characteristics**: Clear and structural
- **Optimization**: Highly structured, methodical
- **Cultural Context**: Precision and order

### Russian (ru)
- **Characteristics**: Direct and imperative
- **Optimization**: Strong, clear commands
- **Cultural Context**: Directness valued

### Portuguese (pt)
- **Characteristics**: Friendly yet clear
- **Optimization**: Approachable but professional
- **Cultural Context**: Warmth and professionalism

### Italian (it)
- **Characteristics**: Elegant and descriptive
- **Optimization**: Expressive yet precise
- **Cultural Context**: Style and clarity

### Indonesian (id)
- **Characteristics**: Polite and clear
- **Optimization**: Respectful, straightforward
- **Cultural Context**: Politeness essential

### Thai (th)
- **Characteristics**: Very polite and indirect
- **Optimization**: Maximum politeness with clarity
- **Cultural Context**: Extreme respect and indirectness

### Vietnamese (vi)
- **Characteristics**: Polite and structural
- **Optimization**: Respectful, well-organized
- **Cultural Context**: Respect and structure

## Performance Optimization Notes

### PERF-WARNING Considerations
All prompts are designed with the following performance principles:
- Minimal token usage while maintaining clarity
- Structured format to reduce parsing overhead
- Clear delimiters ([SLAVE:...] ... [/SLAVE]) for efficient extraction
- No redundant instructions

### Memory Management
- Prompts are stored as template strings (not functions)
- Interpolation only happens at runtime
- No memory leaks from closure references

## Testing Strategy
1. Unit tests for prompt interpolation
2. Integration tests with actual LLM responses
3. Performance benchmarks for token efficiency
4. Cultural appropriateness review by native speakers

Last Updated: 2025-11-22
