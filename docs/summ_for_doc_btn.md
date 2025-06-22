# Medical Communication Assistant

## Project Description
A standalone AI-powered button feature integrated into an existing web app that helps patients organize their thoughts when writing to doctors. Users type their medical concerns in a text area, click "Summarize for Dr.", and receive a comma-separated abbreviated sentence summary (target 20-25 words with flexibility) prepended above their original message that extracts only available medical information in a concise, medical-style format.

## Target Audience
- Patients who struggle to organize their thoughts when writing to doctors
- Any patient writing to their healthcare provider who wants to communicate more effectively

## Desired Features
### Core Functionality
- [ ] Freeform text input area
- [ ] "Summarize for Dr." button with disabled/loading state during processing
- [ ] AI-generated comma-separated abbreviated sentence summary that extracts only mentioned information:
    - [ ] Patient's main issue/symptom
    - [ ] Onset/when the issue presents itself
    - [ ] Current medications (only if mentioned)
    - [] intensity 
    - [] duration
- [ ] Summary prepended above original patient message
- [ ] Copy button for complete message that allows the text to be copied to another location (summary + original)

### User Experience
- [ ] Loading indicator during AI processing
- [ ] Clear visual distinction between AI summary and original text
- [ ] Error handling and user feedback for AI failures
- [ ] Button disabled state during processing

### AI Integration
- [ ] Backend API integration with AI provider
- [ ] Prompt engineering for comma-separated abbreviated sentence format
- [ ] Extract and organize only available information
- [ ] Target 20-25 words with flexibility to include all key information
- [ ] Convert severity descriptions to numbers when possible

## Design Requests
- [ ] Clean, accessible web interface
- [ ] Clear visual separation between summary and original sections
- [ ] Appropriate labels for each section

## Other Notes
- Web-only implementation
- Focus on comma-separated medical-style sentence format
- Only include mentioned categories
- Flexible word count prioritizing complete information
- Integration with existing web app