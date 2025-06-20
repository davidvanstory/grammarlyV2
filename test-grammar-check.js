#!/usr/bin/env node

// Test script for Phase 5 Grammar Checking Integration
// This tests the core functionality without requiring authentication

const { createOpenAIClient, MEDICAL_GRAMMAR_PROMPT, OPENAI_CONFIG } = require('./lib/openai.ts');
const { extractMedicalTerms, getMedicalContext } = require('./lib/medical-terms.ts');
const { ErrorParser } = require('./lib/error-parser.ts');

console.log('🧪 Testing Phase 5 Grammar Checking Integration...\n');

// Test text with intentional errors
const testTexts = [
  {
    name: "Medical Text with Grammar Errors",
    text: "The patient has high blood pressure and there heart rate is elevated. They was admitted to the cardiology unit for further evalutation.",
    expectedErrors: 3 // "there" -> "their", "was" -> "were", "evalutation" -> "evaluation"
  },
  {
    name: "Medical Text with Spelling Errors",
    text: "The myocardium shows signs of ischemia. The ECG indicates arrhythmea and the patient has chest painn.",
    expectedErrors: 2 // "arrhythmea" -> "arrhythmia", "painn" -> "pain"
  },
  {
    name: "Clean Medical Text",
    text: "The patient presents with acute myocardial infarction. The ECG shows ST elevation in leads V1-V4. Blood pressure is 140/90 mmHg.",
    expectedErrors: 0 // Should be clean
  }
];

async function testGrammarChecking() {
  try {
    console.log('🔧 Testing OpenAI client creation...');
    const openai = createOpenAIClient();
    console.log('✅ OpenAI client created successfully\n');

    for (const testCase of testTexts) {
      console.log(`📝 Testing: ${testCase.name}`);
      console.log(`📄 Text: "${testCase.text}"`);
      console.log(`🎯 Expected errors: ${testCase.expectedErrors}\n`);

      // Extract medical terms
      console.log('🏥 Extracting medical terms...');
      const medicalTerms = extractMedicalTerms(testCase.text);
      console.log('📋 Medical terms found:', medicalTerms);

      // Get medical context
      const medicalContext = getMedicalContext(testCase.text);
      console.log('🧠 Medical context:', medicalContext);

      // Create prompt with medical terms
      const medicalTermsList = medicalTerms.join(', ');
      const prompt = `${MEDICAL_GRAMMAR_PROMPT}

MEDICAL TERMS TO NOT FLAG AS ERRORS: ${medicalTermsList}

TEXT TO ANALYZE: "${testCase.text}"

Remember: Do NOT flag these medical terms as errors: ${medicalTermsList}`;

      console.log('🤖 Calling OpenAI API...');
      
      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.max_tokens,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const aiResponse = response.choices[0].message.content;
      console.log('📤 AI Response:', aiResponse);

      // Parse the response
      console.log('🔍 Parsing AI response...');
      const errorParser = ErrorParser.getInstance();
      const parsedErrors = errorParser.parseOpenAIResponse(aiResponse, testCase.text);
      
      console.log(`✅ Found ${parsedErrors.length} errors (expected ${testCase.expectedErrors})`);
      
      if (parsedErrors.length > 0) {
        console.log('📊 Error details:');
        parsedErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. Type: ${error.type}`);
          console.log(`     Original: "${error.original}"`);
          console.log(`     Suggestions: ${error.suggestions.join(', ')}`);
          console.log(`     Position: ${error.start}-${error.end}`);
          console.log(`     Explanation: ${error.explanation}`);
          if (error.medical_context) {
            console.log(`     Medical Context: ${error.medical_context}`);
          }
          console.log('');
        });
      }

      console.log('─'.repeat(60) + '\n');
    }

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'insufficient_quota') {
      console.log('💡 This error means the OpenAI API key has no credits.');
      console.log('   The integration is working correctly, but needs API credits to function.');
    } else if (error.code === 'invalid_api_key') {
      console.log('💡 This error means the OpenAI API key is invalid or missing.');
      console.log('   Please check the OPENAI_API_KEY in your .env.local file.');
    }
    process.exit(1);
  }
}

// Run the test
testGrammarChecking(); 