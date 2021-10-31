# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  VAGRANT_PLUGINS = ["vagrant-reload", "vagrant-vbguest"]
  VAGRANT_PLUGINS.each do |plugin|
    unless Vagrant.has_plugin?("#{plugin}")
      system("vagrant plugin install #{plugin}")
      exit system('vagrant', *ARGV)
    end
  end
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  config.vm.box = "fedora/34-cloud-base"
  config.vm.box_version = "34.20210423.0"
  config.vm.provider "virtualbox"
  config.vm.define "gnome-shell-40"
  
  config.vbguest.auto_update = false

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  config.vm.network "forwarded_port", guest: 3389, host: 10389
  config.vm.usable_port_range = 10000..12000

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine and only allow access
  # via 127.0.0.1 to disable public access
  # config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.56.4"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  config.vm.synced_folder "./dist", "/home/vagrant/.local/share/gnome-shell/extensions/extensions-sync@elhan.io"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  config.vm.provider "virtualbox" do |vb|
    # Display the VirtualBox GUI when booting the machine
    vb.gui = true
  
    # Customize the amount of memory on the VM:
    vb.memory = 1024
    vb.cpus = 2
    vb.customize ["modifyvm", :id, "--accelerate3d", "on"]
    vb.customize ["modifyvm", :id, "--vram", "128"]
    vb.customize ["modifyvm", :id, "--usb", "on"]
    vb.customize ["modifyvm", :id, "--usbehci", "off"]
    vb.customize ["modifyvm", :id, "--hwvirtex", "on"]
    vb.customize ["modifyvm", :id, "--graphicscontroller", "vmsvga"]
  end
  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Enable provisioning with a shell script. Additional provisioners such as
  # Ansible, Chef, Docker, Puppet and Salt are also available. Please see the
  # documentation for more information about their specific syntax and use.
  config.vm.provision "shell", inline: <<-SHELL
    dnf update -y
    dnf install -y gnome-shell gnome-tweaks gnome-extensions-app @development-tools xrdp gnome-terminal vim
    systemctl set-default graphical.target
    echo "[daemon]" > /etc/gdm/custom.conf
    echo "AutomaticLoginEnable = true" >> /etc/gdm/custom.conf
    echo "AutomaticLogin = vagrant" >> /etc/gdm/custom.conf
    systemctl enable gdm
    systemctl enable xrdp
    gsettings set org.gnome.shell welcome-dialog-last-shown-version "999" || true

  SHELL
  config.vm.provision :reload
end
