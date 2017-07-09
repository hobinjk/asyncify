
it('creates a user', (done) => {
  chai.request(server)
    .post(Constants.USERS_PATH)
    .send(testUser).end((err, res) => {
    expect(res).to.have.status(200);
    done();
  });
});

it('creates another user', (done) => {
  chai.request(server)
    .post(Constants.USERS_PATH)
    .send(testUser).then(res => {
    expect(res).to.have.status(200);
      return chai.request(server)
        .post(Constants.LOGIN_PATH)
        .send(testUser);
  }).then(res => {
    expect(res).to.have.status(202);
    done();
  });

  /**
   * let res = await chai.request(server).post.send
   * body
   * let res = await chai.req.post.send
   * expect
   * done()
   */

  /* let res = await full thing with promise
   * hmmmm
   */
});

function alone() {
  return somePromise().then(result => {
    return result.otherPromise();
  }).then(nestedResult => {
    return 12;
  });
}

/**
 * const result = await somePromise();
 * const nestedResult = await result.otherPromise();
 * return await result.???
 */
