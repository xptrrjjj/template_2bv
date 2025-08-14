import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { configs as tsConfigs } from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import("eslint").Linter.FlatConfig[]} */
const eslintConfig = [
  // Next.js + TypeScript base config
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Type-aware rules from @typescript-eslint with no plugin redefinition
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: (await import("@typescript-eslint/parser")).default,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      ...tsConfigs.recommendedTypeChecked.rules,
    },
  },

  // Relaxed rules for TeamTailor integration placeholder files
  {
    files: ["lib/integrations/teamtailor/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Relaxed rules for AI service files with complex types
  {
    files: [
      "src/services/ai/**/*.ts",
      "src/services/jobRoles/**/*.ts", 
      "src/prompts/**/*.ts"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Relaxed rules for API routes with placeholder implementations
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Relaxed rules for action files
  {
    files: ["src/app/actions/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Relaxed rules for component files with complex prop handling
  {
    files: [
      "src/components/job-roles/**/*.tsx",
      "src/app/roles/components/**/*.tsx",
      "src/app/roles/utils/**/*.ts"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/no-unescaped-entities": "off"
    },
  },

  // Relaxed rules for service files
  {
    files: ["src/services/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-anonymous-default-export": "off"
    },
  },

  // Relaxed rules for main app pages
  {
    files: ["src/app/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
