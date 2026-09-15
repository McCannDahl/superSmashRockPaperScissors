export interface IAdProvider {
  name: string;
  initialize(): Promise<void>;
  showBanner(containerElementId: string): void;
  hideBanner(containerElementId: string): void;
  isAdFree(): boolean;
  setAdFree(adFree: boolean): void;
}

export class NullAdProvider implements IAdProvider {
  public name = 'NullAdProvider';
  private adFree = false;

  public async initialize(): Promise<void> {}
  public showBanner(): void {}
  public hideBanner(): void {}
  public isAdFree(): boolean {
    return this.adFree;
  }
  public setAdFree(adFree: boolean): void {
    this.adFree = adFree;
  }
}

export class GenericBannerAdProvider implements IAdProvider {
  public name = 'GenericBannerAdProvider';
  private adFree = false;

  constructor() {
    this.adFree = localStorage.getItem('rpsboom_adfree') === 'true';
  }

  public async initialize(): Promise<void> {
    // Ready for ad network script injection
  }

  public showBanner(containerElementId: string): void {
    if (this.adFree) return;
    const el = document.getElementById(containerElementId);
    if (!el) return;

    el.innerHTML = `
      <div style="background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 18px; text-align: center; color: #8899aa; font-size: 12px; font-family: monospace;">
        ⚡ SPONSORED: Enjoying Rock Paper Scissors Boom? Share your room link with friends!
      </div>
    `;
    el.style.display = 'block';
  }

  public hideBanner(containerElementId: string): void {
    const el = document.getElementById(containerElementId);
    if (el) {
      el.style.display = 'none';
      el.innerHTML = '';
    }
  }

  public isAdFree(): boolean {
    return this.adFree;
  }

  public setAdFree(adFree: boolean): void {
    this.adFree = adFree;
    localStorage.setItem('rpsboom_adfree', adFree ? 'true' : 'false');
  }
}

export const ads = new GenericBannerAdProvider();
