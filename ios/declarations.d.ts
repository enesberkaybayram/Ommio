declare module 'react-native-widget-center' {
    /**
     * Tüm widget timeline'larını yeniler.
     */
    export function reloadAllTimelines(): void;

    /**
     * Belirli bir 'kind' (tür) ismine sahip widget'ı yeniler.
     * @param kind Widget'ın kind string değeri (örn: com.seninadin.ommio.widget)
     */
    export function reloadTimelines(kind: string): void;

    /**
     * @deprecated Bu kütüphanenin eski versiyonlarında kullanılan bir metod olabilir.
     */
    export function reloadKind(kind: string): void;
}