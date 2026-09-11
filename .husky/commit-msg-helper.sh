#!/bin/sh

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${RED}❌ Commit rejeitado!${NC}"
echo ""
echo "${YELLOW}📋 Formato esperado:${NC}"
echo "${BLUE}  <tipo>(<escopo opcional>): <descrição>${NC}"
echo ""
echo "${YELLOW}✅ Exemplos válidos:${NC}"
echo "${GREEN}  feat: adiciona autenticação JWT${NC}"
echo "${GREEN}  feat(api): cria endpoint de usuários${NC}"
echo "${GREEN}  fix: corrige bug no login${NC}"
echo "${GREEN}  fix(auth): resolve problema de token expirado${NC}"
echo "${GREEN}  docs: atualiza README com instruções${NC}"
echo "${GREEN}  chore: atualiza dependências${NC}"
echo "${GREEN}  refactor(components): melhora estrutura de pastas${NC}"
echo "${GREEN}  test: adiciona testes unitários${NC}"
echo ""
echo "${YELLOW}📝 Tipos permitidos:${NC}"
echo "  ${BLUE}feat${NC}     - Nova funcionalidade"
echo "  ${BLUE}fix${NC}      - Correção de bug"
echo "  ${BLUE}docs${NC}     - Documentação"
echo "  ${BLUE}style${NC}    - Formatação de código"
echo "  ${BLUE}refactor${NC} - Refatoração"
echo "  ${BLUE}test${NC}     - Testes"
echo "  ${BLUE}chore${NC}    - Tarefas gerais/manutenção"
echo "  ${BLUE}perf${NC}     - Melhoria de performance"
echo "  ${BLUE}ci${NC}       - Integração contínua"
echo "  ${BLUE}build${NC}    - Sistema de build"
echo "  ${BLUE}revert${NC}   - Reverter commit"
