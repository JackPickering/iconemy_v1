const cmd=require('node-cmd');

var build_name = process.argv[2];

try {
	cmd.get(
		`
			rm -r -f build
            cp -r ../build_folders/` + build_name + ` build
            mv app/index.html app/create.html
            mv app/run.html app/index.html
            npm run dev
        `,
	    function(err, data, stderr){
	        if (!err) {
	        	if(data.includes("Network up to date.")){
	        		console.log('The contracts have already been released onto the network!')
	        	} else {
	                console.log(data)
	        	}
	        } else {
	            console.log('error', err)
	        }
	    }
	);
}
catch (error) {
  console.error('Error occurred:', error);
}