
const Soup = imports.gi.Soup;
const Lang = imports.lang;

var Request = class Request {

  constructor({ auth }) {
    this.auth = auth;
  }

  send({ url, options, params, onResponse }) {
    const { method, contentType, userAgent } = options;

    const session = new Soup.SessionAsync({ user_agent: userAgent });
    const uri = new Soup.URI(url);


    if(this.auth) {
      uri.set_user(this.auth.user);
      uri.set_password(this.auth.token);

      const basicAuth = new Soup.AuthBasic({host: this.auth.host, realm: this.auth.realm});
      const authManager = new Soup.AuthManager();

      authManager.use_auth(uri, basicAuth);
      Soup.Session.prototype.add_feature.call(session, authManager);
    }

    const message = new Soup.Message({ method, uri });

    if (method !== 'GET' && method !== 'HEAD') {
      message.set_request(contentType, Soup.MemoryUse.COPY, JSON.stringify(params));
    }

    session.queue_message(message, Lang.bind(this, (_, response) => {
      onResponse(response.status_code, message.response_body.data);
    }));
  }
}
