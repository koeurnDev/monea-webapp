import { useLayoutEffect, useRef } from "react";

interface OneLineNameProps {
    name?: string | null;
    className?: string;
    ariaHidden?: boolean;
}

interface CoupleNamesLineProps {
    groom?: string | null;
    bride?: string | null;
    separator?: string;
    className?: string;
}

export function OneLineName({ name, className = "", ariaHidden }: OneLineNameProps) {
    const nameRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const element = nameRef.current;
        const parent = element?.parentElement;
        if (!element || !parent) return;

        const fitName = () => {
            element.style.removeProperty("font-size");
            const computedStyle = getComputedStyle(element);
            const baseFontSize = Number.parseFloat(computedStyle.fontSize);
            if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) return;
            const availableWidth = element.clientWidth;
            if (availableWidth <= 0) return;

            const measurement = element.cloneNode(true) as HTMLSpanElement;
            measurement.style.setProperty("position", "fixed", "important");
            measurement.style.setProperty("left", "-100000px", "important");
            measurement.style.setProperty("top", "0", "important");
            measurement.style.setProperty("display", "inline-block", "important");
            measurement.style.setProperty("width", "max-content", "important");
            measurement.style.setProperty("min-width", "0", "important");
            measurement.style.setProperty("max-width", "none", "important");
            measurement.style.setProperty("white-space", "nowrap", "important");
            measurement.style.setProperty("font-size", `${baseFontSize}px`, "important");
            measurement.style.setProperty("font-family", computedStyle.fontFamily, "important");
            measurement.style.setProperty("font-weight", computedStyle.fontWeight, "important");
            measurement.style.setProperty("font-style", computedStyle.fontStyle, "important");
            measurement.style.setProperty("letter-spacing", computedStyle.letterSpacing, "important");
            measurement.style.setProperty("word-spacing", computedStyle.wordSpacing, "important");
            measurement.style.setProperty("text-transform", computedStyle.textTransform, "important");
            measurement.style.setProperty("visibility", "hidden", "important");
            document.body.appendChild(measurement);
            const textWidth = measurement.getBoundingClientRect().width;
            measurement.remove();

            const fittedFontSize = textWidth > availableWidth
                ? baseFontSize * (availableWidth / textWidth)
                : baseFontSize;
            element.style.fontSize = `${fittedFontSize}px`;
        };

        const observer = new ResizeObserver(fitName);
        observer.observe(parent);
        fitName();
        void document.fonts?.ready.then(fitName);

        return () => observer.disconnect();
    }, [name, className]);

    if (!name) return null;

    return (
        <span ref={nameRef} aria-hidden={ariaHidden} className={`block min-w-0 max-w-full whitespace-nowrap ${className}`}>
            {name}
        </span>
    );
}

export function CoupleNamesLine({
    groom,
    bride,
    separator = "&",
    className = "",
}: CoupleNamesLineProps) {
    const couple = [groom, bride].filter(Boolean).join(` ${separator} `);
    return <OneLineName name={couple} className={className} />;
}
