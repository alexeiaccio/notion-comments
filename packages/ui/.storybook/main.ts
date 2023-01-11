import type { StorybookConfig } from "@storybook/builder-vite";

const config: StorybookConfig = {
  stories: ["../**/*.stories.mdx", "../**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
  },
  core: {
    builder: "@storybook/builder-vite",
  },
  async viteFinal(config) {
    return config;
  },
};

export default config;
