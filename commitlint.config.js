module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // Nova funcionalidade
        "fix", // Correção de bug
        "docs", // Documentação
        "style", // Formatação
        "refactor", // Refatoração
        "test", // Testes
        "chore", // Manutenção
        "perf", // Performance
        "ci", // CI/CD
        "build", // Build
        "revert", // Reverter commit
      ],
    ],
  },
  prompt: {
    messages: {
      skip: ":skip",
      max: "máximo de %d caracteres",
      min: "mínimo de %d caracteres",
      emptyWarning: "não pode estar vazio",
      upperLimitWarning: "acima do limite",
      lowerLimitWarning: "abaixo do limite",
    },
    questions: {
      type: {
        description: "Selecione o tipo de mudança que você está commitando",
        enum: {
          feat: {
            description: "✨ Uma nova funcionalidade",
            title: "Features",
            emoji: "✨",
          },
          fix: {
            description: "🐛 Uma correção de bug",
            title: "Bug Fixes",
            emoji: "🐛",
          },
          docs: {
            description: "📚 Mudanças apenas na documentação",
            title: "Documentation",
            emoji: "📚",
          },
          style: {
            description:
              "💎 Mudanças que não afetam o significado do código (formatação)",
            title: "Styles",
            emoji: "💎",
          },
          refactor: {
            description:
              "📦 Mudanças de código que não corrigem bugs nem adicionam funcionalidades",
            title: "Code Refactoring",
            emoji: "📦",
          },
          perf: {
            description: "🚀 Mudanças que melhoram a performance",
            title: "Performance Improvements",
            emoji: "🚀",
          },
          test: {
            description: "🚨 Adição ou correção de testes",
            title: "Tests",
            emoji: "🚨",
          },
          build: {
            description:
              "🛠 Mudanças no sistema de build ou dependências externas",
            title: "Builds",
            emoji: "🛠",
          },
          ci: {
            description: "⚙️ Mudanças em arquivos e scripts de CI",
            title: "Continuous Integrations",
            emoji: "⚙️",
          },
          chore: {
            description:
              "♻️ Outras mudanças que não modificam src ou arquivos de teste",
            title: "Chores",
            emoji: "♻️",
          },
          revert: {
            description: "🗑 Reverte um commit anterior",
            title: "Reverts",
            emoji: "🗑",
          },
        },
      },
      scope: {
        description:
          "Qual é o escopo dessa mudança (ex: componente ou nome do arquivo)",
      },
      subject: {
        description: "Escreva uma descrição curta e imperativa da mudança",
      },
      body: {
        description: "Forneça uma descrição mais detalhada da mudança",
      },
      isBreaking: {
        description: "Há alguma breaking change?",
      },
      breakingBody: {
        description:
          "Um commit com breaking change requer um corpo. Por favor, informe uma descrição mais longa do commit",
      },
      breaking: {
        description: "Descreva as breaking changes",
      },
      isIssueAffected: {
        description: "Essa mudança afeta alguma issue aberta?",
      },
      issuesBody: {
        description:
          "Se há issues fechadas, o commit requer um corpo. Por favor, informe uma descrição mais longa do commit",
      },
      issues: {
        description:
          'Adicione as issues relacionadas (ex: "fix #123", "re #456")',
      },
    },
  },
  helpUrl:
    "https://github.com/conventional-changelog/commitlint/#what-is-commitlint",
};
