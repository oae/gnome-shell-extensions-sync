import { Github } from "./providers/github";
import { Provider } from "./api";

export class Api {
  private provider: Provider;

  constructor() {
    // We use github as a provider for now.
    this.provider = new Github();
  }

  upload(): void {
    this.provider.upload();
  }

  download(): void {
    this.provider.download();
  }
}
