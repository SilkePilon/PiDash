import { defineConfig, presetIcons, presetUno, presetWebFonts, transformerDirectives, transformerVariantGroup } from "unocss";
import presetAnimations from "unocss-preset-animations";
import { presetUseful } from "unocss-preset-useful";

// Custom animations
const animations = {
    keyframes: {
        fadeIn: '{from{opacity:0}to{opacity:1}}',
        fadeInScale: '{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}',
        fadeInScaleUp: '{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}',
        fadeInDown: '{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}',
        fadeInLeft: '{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}',
        fadeInRight: '{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}'
    },
    durations: {
        fadeIn: '200ms',
        fadeInScale: '200ms',
        fadeInScaleUp: '200ms',
        fadeInDown: '200ms',
        fadeInLeft: '200ms',
        fadeInRight: '200ms'
    }
};

export default defineConfig({
    shortcuts: [
        // Animation shortcuts
        ['animate-fadeIn', 'animate-fadeIn-200ms animate-ease-out animate-fill-both'],
        ['animate-fadeInScale', 'animate-fadeInScale-200ms animate-ease-out animate-fill-both'],
        ['animate-fadeInScaleUp', 'animate-fadeInScaleUp-200ms animate-ease-out animate-fill-both'],
        ['animate-fadeInDown', 'animate-fadeInDown-200ms animate-ease-out animate-fill-both'],
        ['animate-fadeInLeft', 'animate-fadeInLeft-200ms animate-ease-out animate-fill-both'],
        ['animate-fadeInRight', 'animate-fadeInRight-200ms animate-ease-out animate-fill-both'],
        
        // Common style combinations
        ['flex-center', 'flex items-center justify-center'],
        ['absolute-center', 'absolute top-1/2 left-1/2 -translate-1/2'],
        ['size-full', 'w-full h-full'],
        ['size-screen', 'w-screen h-screen'],
    ],
    presets: [
        presetUno(),
        presetIcons(),
        presetWebFonts({
            fonts: {
                sans: [
                    {
                        name: "Inter",
                        weights: ["400", "500", "600", "700", "800", "900"],
                        italic: true,
                    },
                ],
            },
        }),
        presetAnimations(),
        presetUseful(),
    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
    ],
    // Custom theme values
    theme: {
        animation: animations,
    },
});
