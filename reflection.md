# Engineering Reflection: Building with AI Coding Agents (`reflection.md`)

*Author: Jeet Pitale*  
*Project: Salon Queue Management System*

---

### 1. The Agent's Mistake / Misunderstanding
During the localization phase of the project, I instructed the AI agent to implement complete trilingual support for English, Hindi, and Gujarati. The agent created a translation dictionary in `i18n.ts` and updated the UI components so that headings, buttons, and static strings changed when switching languages. 

However, the agent overlooked dynamic data interpolations. Numeric figures—such as the estimated wait time (`139`), the count of people waiting (`13`), the daily operating hours (`09:00 - 21:00`), service prices (`₹350`), and token numbers (`#1`)—were rendered directly from raw JavaScript numbers and strings. As a result, the static words translated, but the numerals remained in standard Western Arabic digits (`0–9`) instead of local Gujarati numerals (`૦–૯`) or Devanagari numerals (`०–९`).

### 2. How I Identified the Issue
While running the application locally on a mobile viewport and switching the language to Gujarati (`ગુ`), the hero wait card prominently displayed:
> **૧૩૯** was rendered as **`139 મિનિટ`**  
> **૧૩** was rendered as **`13 રાહ જોતા લોકો`**  
> **૦૯:૦૦ - ૨૧:૦૦** was rendered as **`09:00 - 21:00`**

Seeing Gujarati text directly adjacent to untranslated Western digits made the localization look broken and incomplete. A quick inspection of the code revealed that the agent had only translated static dictionary keys via `t("key")`, while all dynamic variables were being rendered bare as `{waitMinutes}` or `{waitingCount}`.

### 3. How I Corrected the Issue
Rather than rewriting the code manually, I took a screenshot of the issue and prompted the agent:
> *"number is not translating when i am using inbuilt translate of website"*

I directed the agent to create a dedicated numeral transliteration utility (`formatLocalizedNumber` and `tNumber`) in `src/lib/i18n.ts` and `src/components/LanguageContext.tsx`. This engine replaced individual digits `0–9` with their localized equivalents:
- **Gujarati**: `[૦, ૧, ૨, ૩, ૪, ૫, ૬, ૭, ૮, ૯]`
- **Devanagari (Hindi)**: `[०, १, २, ३, ४, ५, ६, ७, ८, ९]`
- **English**: Preserved standard Western digits `[0–9]`

We then wrapped all count, duration, currency, and timestamp interpolations across the customer homepage, queue join form, live tracking card, display board, and kiosk. To prevent future regressions, we wrote automated unit tests in `tests/i18n-numbers.test.ts` and verified the fix live in headless Chrome.

### 4. Key Takeaways from Working with AI Agents
1. **AI agents have blind spots around dynamic state**: Agents tend to satisfy prompts literally—translating static text when asked to "translate", but missing runtime interpolations, currency formatting, or timestamps unless specifically audited.
2. **Visual & device-level verification is non-negotiable**: Code can compile cleanly and pass static type checks while still failing user-facing requirements. Inspecting the actual UI in a mobile browser view was the only reason this flaw was caught.
3. **Targeted feedback with visual evidence works best**: Providing concrete evidence (like the screenshot of `139 મિનિટ`) allowed the agent to immediately diagnose the exact missing layer of logic and implement a clean, reusable utility rather than a messy workaround.
