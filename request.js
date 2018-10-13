// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const Soup = imports.gi.Soup;

var Request = class Request {

  constructor({ auth }) {
    this.auth = auth;
  }

  async send({ url, method, data }) {

    const session = new Soup.SessionAsync({ user_agent: 'Mozilla/5.0' });
    const uri = new Soup.URI(url);


    if(this.auth) {
      uri.set_user(this.auth.user);
      uri.set_password(this.auth.token);

      const basicAuth = new Soup.AuthBasic({host: this.auth.host, realm: this.auth.realm});
      const authManager = new Soup.AuthManager();

      authManager.use_auth(uri, basicAuth);
      Soup.Session.prototype.add_feature.call(session, authManager);
      Soup.Session.prototype.add_feature.call(session, new Soup.ProxyResolverDefault());
    }

    const message = new Soup.Message({ method, uri });

    if (method !== 'GET' && method !== 'HEAD') {
      message.set_request('application/json', Soup.MemoryUse.COPY, JSON.stringify(data));
    }

    const result = await new Promise((resolve, reject) => {
      session.queue_message(message, (_, response) => resolve({
        status: response.status_code,
        data: JSON.parse(message.response_body.data),
      }));
    });

    return result;
  }
}
