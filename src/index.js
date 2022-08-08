/**
 * rawHtmlResponse returns HTML inputted directly
 * into the worker script
 * @param {string} html
 */

 function rawHtmlResponse(html) {
  const init = {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  };
  return new Response(html, init);

}



/**
 * readRequestBody reads in the incoming request body
 * Use await readRequestBody(..) in an async function to get the string
 * @param {Request} request the incoming request to read from
 */

async function readRequestBody(request) {
  const { headers } = request;
  const contentType = headers.get('content-type') || '';


  if (contentType.includes('form')) {
    const formData = await request.formData();
    const body = {};
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1];
    }
    try {
      const commentdataraw = await comments.get('commentdata') || []
      const commentid = await comments.get('commentid') || 0
      let commentdata = JSON.parse(commentdataraw)
      commentdata.push({
        content: body.content || '',
        email: body.email || '',
        to: parseInt(body.to) || '-1',
        site: body.site || '',
        name: body.name || '',
        reply: parseInt(body.reply) || -1,
        time: Math.floor(new Date().getTime() / 1000),
        id: parseInt(commentid) + 1
      })
      await comments.put('commentdata', JSON.stringify(commentdata))
      await comments.put('commentid', parseInt(commentid) + 1)
    } catch (e) {
      return JSON.stringify({status: 400, msg: 'err!' + e})
    }
    return JSON.stringify({status: 200, msg: 'success'});
  } else {
    // Perhaps some other type of data was submitted in the form
    // like an image, or some other binary data.
    return JSON.stringify({status: 400, msg: 'err!'})
  }

}

async function handleRequest(request) {
  const reqBody = await readRequestBody(request);
  let init = {status: 200, headers: {'Access-Control-Allow-Origin': '*'}}
  if(JSON.parse(reqBody).status === 400){
    init.status = 400
  }
  return new Response(reqBody, init);

}

async function getCommentData(request) {
  let data = await comments.get('commentdata');
  return new Response(data, {headers: {'Access-Control-Allow-Origin': '*'}});
}

addEventListener('fetch', event => {
  const { request } = event;

  if (request.method === 'POST') {
    return event.respondWith(handleRequest(request));
  } else if (request.method === 'GET') {
    return event.respondWith(getCommentData(request));
  } else if (request.method === 'OPTIONS') {
    return event.respondWith(new Response('', {headers: {  'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS', 'Access-Control-Max-Age': '86400', 'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers')}}))
  }
});