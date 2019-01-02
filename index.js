/*
 * @Author: sky
 * @Date: 2018-12-23 21:04:09
 * @Description: 主要是 express 的路由
 */
const http = require('http');
const url = require('url');


function createApplication() {
    // app 是一个监听函数
    let app = (req, res) => {
        // 取出每一个 layer
        // 1.获取请求的方法、请求的路径
        let m = req.method.toLowerCase();
        let {
            pathname
        } = url.parse(req.url, true);

        for (let i = 0; i < app.routes.length; i++) {
            let {
                method,
                path,
                handler
            } = app.routes[i];
            if ((method === m || method === 'all') && (path === pathname || path === '*')) {
                // 2.匹配成功后执行对应的 callback
                handler(req, res);
            }
        }
        res.end(`Connot ${m} ${pathname}`);
    };

    // 存放所有的路由
    app.routes = [];

    app.all = (path, handler) => {
        // 如果 method 是 all 表示全部匹配
        let layer = {
            method: 'all',
            path,
            handler
        };

        // 加入不同的方法
        app.routes.push(layer);
    }

    http.METHODS.forEach(method => {

        // 将方法转换成小写的
        // method = method.toLowerCase();
        method = method.toLocaleLowerCase();

        app[method] = (path, handler) => {
            let layer = {
                method,
                path,
                handler
            };

            // 加入不同的方法
            app.routes.push(layer);
        };
    });

    app.listen = () => {
        let server = http.createServer(app);
        server.listen(...arguments);
    }

    return app;
}



module.exports = createApplication;