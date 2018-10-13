// Copyright (C) 2018 O. Alperen Elhan
//
// This file is part of Extensions Sync.
//
// Extensions Sync is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.
//
// Extensions Sync is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Extensions Sync.  If not, see <http://www.gnu.org/licenses/>.
//

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
