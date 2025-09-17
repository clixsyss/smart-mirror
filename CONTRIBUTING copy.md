# Contributing to Clixsys Smart Mirror

Thank you for your interest in contributing to the Clixsys Smart Mirror project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- A GitHub account

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/smart-mirror.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm run lint && npm run build`
7. Commit your changes: `git commit -m "Add your feature"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Create a Pull Request

## 📋 Development Guidelines

### Code Style
- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

### Component Guidelines
- Use functional components with hooks
- Implement proper TypeScript types
- Follow the established design system
- Ensure touch-friendly interactions (44px minimum)
- Test on different screen sizes

### CSS Guidelines
- Use the established design tokens
- Follow BEM methodology for class names
- Use CSS custom properties for theming
- Ensure responsive design
- Optimize for performance

## 🧪 Testing

### Before Submitting
- [ ] Code passes all linting checks
- [ ] Build completes without errors
- [ ] Tested on different screen sizes
- [ ] Touch interactions work properly
- [ ] No console errors
- [ ] Performance is acceptable

### Testing Checklist
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Touch screen interactions
- [ ] Dark mode appearance
- [ ] Loading states
- [ ] Error states

## 📝 Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(weather): add 7-day forecast
fix(login): resolve authentication issue
docs(readme): update installation instructions
```

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser/device information
- Console errors (if any)

## 💡 Feature Requests

When suggesting features:
- Describe the use case
- Explain the benefit
- Provide mockups or examples if possible
- Consider implementation complexity
- Check for existing similar requests

## 🔄 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines
3. **Test thoroughly** on multiple devices
4. **Update documentation** if needed
5. **Create a Pull Request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots or videos
   - Testing checklist

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on desktop
- [ ] Tested on tablet
- [ ] Tested on mobile
- [ ] Touch interactions work
- [ ] No console errors

## Screenshots
Add screenshots if applicable

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🏗️ Architecture

### Project Structure
```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts
├── stores/         # State management
├── utils/          # Utility functions
├── config/         # Configuration files
└── App.jsx         # Main application
```

### Design System
- **Colors**: Defined in CSS custom properties
- **Typography**: Inter font family
- **Spacing**: 8px base unit
- **Touch Targets**: Minimum 44px
- **Border Radius**: 12px-24px

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)

## 🤝 Community

- Join our Discord server
- Follow us on Twitter
- Check our blog for updates
- Attend our monthly meetups

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation
- Annual contributor awards

Thank you for contributing to Clixsys Smart Mirror! 🎉
