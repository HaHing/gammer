# Contributing to Gammer

First off, thank you for considering contributing to Gammer! 🎉

## 📜 Code of Conduct

This project and everyone participating in it is governed by basic principles of respect and inclusivity. By participating, you are expected to uphold this code.

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and expected**
- **Include screenshots if possible**
- **Include your environment details**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the expected behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** with clear commit messages
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request**

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key

### Getting Started

```bash
# Clone your fork
git clone https://github.com/your-username/gammer.git
cd gammer

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

### Project Structure

```
src/
├── app/          # Next.js App Router pages and API routes
├── components/   # React components
├── lib/          # Core business logic (AI, PPTX, Research)
├── store/        # Zustand state management
├── types/        # TypeScript type definitions
└── data/         # Static data (templates, examples)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/ai-generator.ts` | AI slide generation logic |
| `src/lib/research-engine.ts` | Web search and research |
| `src/lib/pptx-engine.ts` | PowerPoint rendering |
| `src/store/presentation.ts` | State management |
| `src/components/SlideRenderer.tsx` | Slide preview |

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types for all functions and variables
- Avoid `any` type when possible

### React

- Use functional components with hooks
- Follow the existing component structure
- Keep components small and focused

### Styling

- Use Tailwind CSS for styling
- Follow the existing design system in `DESIGN.md`
- Ensure responsive design

### Commits

- Use clear and meaningful commit messages
- Reference issues in commits: `Fix #123: description`
- Use conventional commits format when possible:
  - `feat: add new feature`
  - `fix: resolve bug`
  - `docs: update documentation`
  - `refactor: code refactoring`
  - `test: add tests`

## 🧪 Testing

Currently, the project lacks automated tests. If you'd like to help set up testing:

1. Configure Vitest or Jest
2. Add unit tests for core logic
3. Add integration tests for API routes

## 📚 Documentation

- Update `README.md` for user-facing changes
- Update inline comments for complex logic
- Update `DESIGN.md` for design system changes

## ❓ Questions?

Feel free to open an issue with the `question` label or start a discussion.

---

Thank you for your contributions! 🙏
