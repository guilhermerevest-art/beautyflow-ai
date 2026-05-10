# BeautyFlow AI

Sistema de agendamento inteligente para salões e estúdios de estética.

## Stack
- React 18 + Vite
- Tailwind CSS
- Supabase (auth + banco de dados)
- Deploy: Vercel

## Desenvolvimento

```bash
npm install
npm run dev
```

## Deploy (Vercel)

1. Push para o GitHub
2. Conectar repositório na Vercel
3. Configurar variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy automático a cada push na `main`
